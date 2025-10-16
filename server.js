const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'db', 'business.db');
const PORT = process.env.PORT || 3000;

const app = express();
const db = new sqlite3.Database(DB_PATH);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

app.get('/api/dashboard', async (req, res) => {
  try {
    const [metrics, topProducts, campaigns, projects] = await Promise.all([
      getQuery(
        `SELECT 
          (SELECT COUNT(*) FROM orders) AS orderCount,
          (SELECT IFNULL(SUM(amount),0) FROM payments) AS totalRevenue,
          (SELECT COUNT(*) FROM products) AS productCount,
          (SELECT COUNT(*) FROM customers) AS customerCount`
      ),
      allQuery(
        `SELECT products.id, products.name, products.price, IFNULL(SUM(orders.quantity),0) AS totalSold
         FROM products
         LEFT JOIN orders ON products.id = orders.product_id
         GROUP BY products.id
         ORDER BY totalSold DESC
         LIMIT 5`
      ),
      allQuery(
        `SELECT id, platform, message, status, created_at
         FROM marketing_campaigns
         ORDER BY created_at DESC
         LIMIT 5`
      ),
      allQuery(
        `SELECT id, name, niche, status, created_at
         FROM projects
         ORDER BY created_at DESC
         LIMIT 5`
      )
    ]);

    res.json({ metrics, topProducts, campaigns, projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await allQuery('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, description, price, delivery_method } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  try {
    const result = await runQuery(
      `INSERT INTO products (name, description, price, delivery_method)
       VALUES (?, ?, ?, ?)`,
      [name, description || '', price, delivery_method || 'email']
    );
    const product = await getQuery('SELECT * FROM products WHERE id = ?', [result.id]);
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await allQuery(
      `SELECT orders.id, orders.quantity, orders.status, orders.created_at, customers.name AS customer_name, products.name AS product_name
       FROM orders
       LEFT JOIN customers ON customers.id = orders.customer_id
       LEFT JOIN products ON products.id = orders.product_id
       ORDER BY orders.created_at DESC`
    );
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customer_id, product_id, quantity, status } = req.body;
  if (!customer_id || !product_id || !quantity) {
    return res.status(400).json({ error: 'customer_id, product_id, and quantity are required' });
  }

  try {
    const result = await runQuery(
      `INSERT INTO orders (customer_id, product_id, quantity, status)
       VALUES (?, ?, ?, ?)`,
      [customer_id, product_id, quantity, status || 'pending']
    );
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [result.id]);
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/payments', async (req, res) => {
  try {
    const payments = await allQuery(
      `SELECT payments.id, payments.amount, payments.provider, payments.status, payments.created_at, customers.name AS customer_name
       FROM payments
       LEFT JOIN customers ON customers.id = payments.customer_id
       ORDER BY payments.created_at DESC`
    );
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

app.post('/api/payments', async (req, res) => {
  const { customer_id, amount, provider, status } = req.body;
  if (!customer_id || !amount || !provider) {
    return res.status(400).json({ error: 'customer_id, amount, and provider are required' });
  }

  try {
    const result = await runQuery(
      `INSERT INTO payments (customer_id, amount, provider, status)
       VALUES (?, ?, ?, ?)`,
      [customer_id, amount, provider, status || 'pending']
    );
    const payment = await getQuery('SELECT * FROM payments WHERE id = ?', [result.id]);
    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    const customers = await allQuery('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const result = await runQuery(
      `INSERT INTO customers (name, email, phone)
       VALUES (?, ?, ?)`,
      [name, email || '', phone || '']
    );
    const customer = await getQuery('SELECT * FROM customers WHERE id = ?', [result.id]);
    res.status(201).json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.post('/api/projects', async (req, res) => {
  const { name, niche, status } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  try {
    const result = await runQuery(
      `INSERT INTO projects (name, niche, status)
       VALUES (?, ?, ?)`,
      [name, niche || '', status || 'draft']
    );
    const project = await getQuery('SELECT * FROM projects WHERE id = ?', [result.id]);
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/marketing-campaigns', async (req, res) => {
  try {
    const campaigns = await allQuery('SELECT * FROM marketing_campaigns ORDER BY created_at DESC');
    res.json(campaigns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve marketing campaigns' });
  }
});

app.post('/api/marketing-campaigns', async (req, res) => {
  const { platform, message, status } = req.body;
  if (!platform || !message) {
    return res.status(400).json({ error: 'platform and message are required' });
  }

  try {
    const result = await runQuery(
      `INSERT INTO marketing_campaigns (platform, message, status)
       VALUES (?, ?, ?)`,
      [platform, message, status || 'scheduled']
    );
    const campaign = await getQuery('SELECT * FROM marketing_campaigns WHERE id = ?', [result.id]);
    res.status(201).json(campaign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create marketing campaign' });
  }
});

app.post('/api/automation/run', async (req, res) => {
  try {
    const topProduct = await getQuery(
      `SELECT products.id, products.name, IFNULL(SUM(orders.quantity),0) AS totalSold
       FROM products
       LEFT JOIN orders ON products.id = orders.product_id
       GROUP BY products.id
       ORDER BY totalSold DESC
       LIMIT 1`
    );

    if (topProduct) {
      await runQuery(
        `INSERT INTO marketing_campaigns (platform, message, status)
         VALUES (?, ?, ?)`,
        [
          'facebook',
          `Promotion automatique: Découvrez notre best-seller ${topProduct.name}!`,
          'scheduled'
        ]
      );

      await runQuery(
        `INSERT INTO projects (name, niche, status)
         VALUES (?, ?, ?)`,
        [
          `${topProduct.name} Funnel`,
          `Niche autour de ${topProduct.name}`,
          'active'
        ]
      );
    }

    res.json({ message: 'Automation executed successfully', topProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Automation failed' });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
