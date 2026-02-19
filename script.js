let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let incomes = JSON.parse(localStorage.getItem("incomes")) || [];
let totalBudget = parseFloat(localStorage.getItem("totalBudget")) || 0;
let categoryBudgets = JSON.parse(localStorage.getItem("categoryBudgets")) || {};
let categoryChart;

displayExpenses();
updateDashboard();
displayBudgetDetails();

/* INCOME */
function addIncome() {
    const source = document.getElementById("income-source").value || "Income";
    const amount = parseFloat(document.getElementById("income-amount").value);

    if (isNaN(amount) || amount <= 0) {
        alert("Enter valid income");
        return;
    }

    incomes.push({ id: Date.now(), source, amount });
    localStorage.setItem("incomes", JSON.stringify(incomes));

    updateDashboard();
}

/* DASHBOARD */
function updateDashboard() {
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpense;

    document.getElementById("total-income").textContent = totalIncome.toFixed(2);
    document.getElementById("total-expense").textContent = totalExpense.toFixed(2);
    document.getElementById("balance").textContent = balance.toFixed(2);

    const savingsPercent = totalIncome > 0
        ? ((balance / totalIncome) * 100).toFixed(1)
        : 0;

    document.getElementById("savings-percent").textContent = savingsPercent;

    document.getElementById("balance").style.color =
        balance < 0 ? "red" : "lightgreen";

    showSmartMessage(balance, savingsPercent);
}

function showSmartMessage(balance, savingsPercent) {
    const msgDiv = document.getElementById("smart-message");

    if (balance < 0) {
        msgDiv.innerHTML = "⚠ Warning: You are overspending!";
        msgDiv.style.color = "red";
    }
    else if (savingsPercent > 30) {
        msgDiv.innerHTML = "🎉 Great job! You are saving well!";
        msgDiv.style.color = "lightgreen";
    }
    else {
        msgDiv.innerHTML = "Track your spending carefully.";
        msgDiv.style.color = "orange";
    }
}

/* EXPENSE */
function addExpense() {
    const name = document.getElementById("expense-name").value;
    const amount = parseFloat(document.getElementById("expense-amount").value);
    const category = document.getElementById("expense-category").value;
    const dateInput = document.getElementById("expense-date").value;
    
    const date = dateInput || new Date().toISOString().split("T")[0];

    if (name === "" || isNaN(amount) || amount <= 0) {
        alert("Enter valid details");
        return;
    }

    expenses.push({ id: Date.now(), name, amount, category,date });
    localStorage.setItem("expenses", JSON.stringify(expenses));

    displayExpenses();
    updateDashboard();
}

function displayExpenses() {
    const list = document.getElementById("expense-list");
    const totalDisplay = document.getElementById("total");

    list.innerHTML = "";
    let total = 0;

    expenses.forEach(exp => {
        total += exp.amount;

        const li = document.createElement("li");
li.innerHTML = `
    <div>
        <strong>${exp.name}</strong> - LKR ${exp.amount}
        <br>
        <small>${exp.category} | ${exp.date}</small>
    </div>
    <div>
        <button onclick="editExpense(${exp.id})">Edit</button>
        <button onclick="deleteExpense(${exp.id})">X</button>
    </div>

        `;
        list.appendChild(li);
    });

    totalDisplay.textContent = total.toFixed(2);
    updateSummary();
}

function editExpense(id) {
    const exp = expenses.find(e => e.id === id);

    const newName = prompt("Edit name", exp.name);
    const newAmount = parseFloat(prompt("Edit amount", exp.amount));
    const newDate = prompt("Edit date (YYYY-MM-DD)", exp.date);

    if (newName && !isNaN(newAmount)) {
        exp.name = newName;
        exp.amount = newAmount;
        exp.date = newDate || exp.date;

        localStorage.setItem("expenses", JSON.stringify(expenses));
        displayExpenses();
        updateDashboard();
    }
}


function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    displayExpenses();
    updateDashboard();
}

/* CHART */
function updateSummary() {
    const summaryDiv = document.getElementById("summary");
    summaryDiv.innerHTML = "";

    const categoryTotals = {};

    expenses.forEach(exp => {
        categoryTotals[exp.category] =
            (categoryTotals[exp.category] || 0) + exp.amount;
    });

    for (let cat in categoryTotals) {
        summaryDiv.innerHTML += `<p>${cat}: LKR ${categoryTotals[cat]}</p>`;
    }

    const ctx = document.getElementById('category-chart').getContext('2d');
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses by Category',
                data: data,
                backgroundColor:  ["#ff6384","#36a2eb","#ffce56","#4bc0c0","#9966ff"],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels:{
                        color:'white',
                        font:{
                            size:14
                        }
                    }
                    
                }
            }
        }
    });
}

/* BUDGET */
function setBudget() {
    totalBudget = parseFloat(document.getElementById("total-budget").value);
    localStorage.setItem("totalBudget", totalBudget);
    displayBudgetDetails();
}

function displayBudgetDetails() {
    const div = document.getElementById("budget-details");
    div.innerHTML = "";

    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalBudget - spent;

    div.innerHTML = `
        <p>Total Budget: ${totalBudget}</p>
        <p>Spent: ${spent}</p>
        <p>Remaining: ${remaining}</p>
    `;
}

/* RESET & EXPORT */
function resetAll() {
    if (confirm("Delete everything?")) {
        localStorage.clear();
        location.reload();
    }
}

function exportCSV() {
    let csv = "Name,Amount,Category,Date\n";
    expenses.forEach(e => {
        csv += `${e.name},${e.amount},${e.category},${e.date}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
}

