const metricsElement = document.getElementById('metrics');
const topProductsElement = document.getElementById('top-products');
const campaignsElement = document.getElementById('campaigns');
const projectsElement = document.getElementById('projects');
const ordersTableBody = document.querySelector('#orders-table tbody');
const paymentsTableBody = document.querySelector('#payments-table tbody');
const customerSelect = document.querySelector('#payment-form select[name="customer_id"]');
const automationLog = document.getElementById('automation-log');

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erreur API');
  }
  return response.json();
}

function createListItem(content) {
  const li = document.createElement('li');
  li.textContent = content;
  return li;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString));
}

async function loadDashboard() {
  try {
    const data = await fetchJSON('/api/dashboard');
    const { metrics, topProducts, campaigns, projects } = data;

    if (metrics) {
      const metricValues = [
        metrics.orderCount,
        Number(metrics.totalRevenue).toLocaleString('fr-FR'),
        metrics.productCount,
        metrics.customerCount
      ];
      metricsElement.querySelectorAll('.metric span').forEach((span, index) => {
        span.textContent = metricValues[index] || 0;
      });
    }

    topProductsElement.innerHTML = '';
    topProducts.forEach((product) => {
      topProductsElement.appendChild(
        createListItem(`${product.name} · ${product.totalSold || 0} ventes · ${product.price} FCFA`)
      );
    });

    campaignsElement.innerHTML = '';
    campaigns.forEach((campaign) => {
      campaignsElement.appendChild(
        createListItem(
          `${campaign.platform.toUpperCase()} · ${campaign.status} · ${formatDate(
            campaign.created_at
          )}\n${campaign.message}`
        )
      );
    });

    projectsElement.innerHTML = '';
    projects.forEach((project) => {
      projectsElement.appendChild(
        createListItem(`${project.name} · ${project.niche} · ${project.status}`)
      );
    });
  } catch (error) {
    console.error(error);
  }
}

async function loadCustomers() {
  const customers = await fetchJSON('/api/customers');
  customerSelect.innerHTML = '';
  if (!customers.length) {
    const placeholder = document.createElement('option');
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = 'Ajoutez d\'abord un client';
    customerSelect.appendChild(placeholder);
    return;
  }
  customers.forEach((customer) => {
    const option = document.createElement('option');
    option.value = customer.id;
    option.textContent = `${customer.name} (${customer.phone || 'tel. ?'})`;
    customerSelect.appendChild(option);
  });
}

async function loadOrders() {
  const orders = await fetchJSON('/api/orders');
  ordersTableBody.innerHTML = '';
  orders.forEach((order) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.customer_name || '—'}</td>
      <td>${order.product_name || '—'}</td>
      <td>${order.quantity}</td>
      <td><span class="badge badge-${order.status}">${order.status}</span></td>
      <td>${formatDate(order.created_at)}</td>
    `;
    ordersTableBody.appendChild(row);
  });
}

async function loadPayments() {
  const payments = await fetchJSON('/api/payments');
  paymentsTableBody.innerHTML = '';
  payments.forEach((payment) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${payment.customer_name || '—'}</td>
      <td>${Number(payment.amount).toLocaleString('fr-FR')} FCFA</td>
      <td>${payment.provider}</td>
      <td><span class="badge badge-${payment.status}">${payment.status}</span></td>
      <td>${formatDate(payment.created_at)}</td>
    `;
    paymentsTableBody.appendChild(row);
  });
}

function registerFormHandlers() {
  const productForm = document.getElementById('product-form');
  productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(productForm);
    const payload = Object.fromEntries(formData.entries());
    payload.price = Number(payload.price);

    try {
      await fetchJSON('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      productForm.reset();
      await Promise.all([loadDashboard(), loadOrders()]);
      alert('Produit créé avec succès');
    } catch (error) {
      alert("Impossible de créer le produit : " + error.message);
    }
  });

  const customerForm = document.getElementById('customer-form');
  customerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(customerForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      await fetchJSON('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      customerForm.reset();
      await loadCustomers();
      alert('Client ajouté');
    } catch (error) {
      alert("Impossible d'ajouter le client : " + error.message);
    }
  });

  const paymentForm = document.getElementById('payment-form');
  paymentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(paymentForm);
    const payload = Object.fromEntries(formData.entries());
    payload.amount = Number(payload.amount);
    payload.customer_id = Number(payload.customer_id);

    try {
      await fetchJSON('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      paymentForm.reset();
      await Promise.all([loadDashboard(), loadPayments()]);
      alert('Paiement enregistré');
    } catch (error) {
      alert("Impossible d'enregistrer le paiement : " + error.message);
    }
  });

  const automationButton = document.getElementById('automation-btn');
  automationButton.addEventListener('click', async () => {
    automationButton.disabled = true;
    automationButton.textContent = 'Exécution...';
    automationLog.textContent = 'Analyse des ventes en cours...';
    try {
      const result = await fetchJSON('/api/automation/run', { method: 'POST' });
      automationLog.textContent = JSON.stringify(result, null, 2);
      await loadDashboard();
    } catch (error) {
      automationLog.textContent = 'Erreur: ' + error.message;
    } finally {
      automationButton.disabled = false;
      automationButton.textContent = 'Exécuter Auto-Run';
    }
  });
}

async function bootstrap() {
  registerFormHandlers();
  await Promise.all([
    loadDashboard(),
    loadCustomers(),
    loadOrders(),
    loadPayments()
  ]);
}

document.addEventListener('DOMContentLoaded', bootstrap);
