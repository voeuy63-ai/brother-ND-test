const API_BASE_URL = "https://backend-11zq.onrender.com"; // Change this to your deployed backend url

const TELEGRAM_BOT_TOKEN = "8998859713:AAFOvcttVnqZip52L3dhtPFvWFaTrgQ4TGY";
const TELEGRAM_CHAT_ID = "-1004495647556"; 

let currentOrder = { category: '', value: '', price: 0, ign: '', email: '', platform: '' };
let statusPollInterval = null;

// Page Navigation Function
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        // Reset translation for smooth entry
        page.style.transform = "translate(-50%, -45%)";
        setTimeout(() => page.style.transform = "translate(-50%, -50%)", 50);
    });
    document.getElementById(`page-${pageId}`).classList.add('active');
}

// Select Rank
function selectItem(category, value, price) {
    currentOrder.category = category;
    currentOrder.value = value;
    currentOrder.price = price;
    document.querySelectorAll('.rank-card').forEach(card => card.classList.remove('selected'));
    document.getElementById(`card-${value}`).classList.add('selected');
}

function goToFormStep() {
    if (!currentOrder.value) return alert("❌ សូមមេត្តាជ្រើសរើសយក Rank ណាមួយជាមុនសិន!");
    showPage('form');
}

function goToCheckoutStep() {
    const ign = document.getElementById('input-ign').value.trim();
    const email = document.getElementById('input-email').value.trim();
    const platform = document.getElementById('input-platform').value;

    if (!ign || !email) return alert("❌ សូមបំពេញព័ត៌មានចាំបាច់ (Username និង Email)!");

    currentOrder.ign = ign;
    currentOrder.email = email;
    currentOrder.platform = platform;

    document.getElementById('chk-category').innerText = currentOrder.category.toUpperCase();
    document.getElementById('chk-item').innerText = currentOrder.value.toUpperCase();
    document.getElementById('chk-ign').innerText = currentOrder.ign;
    document.getElementById('chk-email').innerText = currentOrder.email;
    document.getElementById('chk-platform').innerText = currentOrder.platform;
    document.getElementById('chk-usd').innerText = `$${currentOrder.price.toFixed(2)}`;

    showPage('checkout');
}

function backToFormStep() {
    showPage('form');
}

// Confirm and fetch KHQR
async function confirmAndPay() {
    document.getElementById("global-loader").style.display = "flex";

    const payload = {
        player_name: currentOrder.ign,
        platform: currentOrder.platform,
        category: currentOrder.category.toLowerCase(), 
        value: currentOrder.value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        document.getElementById("global-loader").style.display = "none";

        if (result.status === "success") {
            document.getElementById("display-khqr-price").innerText = currentOrder.price.toFixed(2);

            const qrBox = document.getElementById("qrcode-box");
            qrBox.innerHTML = "";
            new QRCode(qrBox, {
                text: result.khqr_string,
                width: 150, 
                height: 150,
                colorDark : "#000000",
                colorLight : "#ffffff"
            });

            document.getElementById("paymentModal").style.display = "flex";
            startPaymentPolling(result.transaction_id);

        } else {
            alert("⚠️ ដំណើរការខុសប្រក្រតី: " + result.message);
        }
    } catch (error) {
        document.getElementById("global-loader").style.display = "none";
        alert("❌ មិនអាចតភ្ជាប់ទៅកាន់ API Server បានទេ!");
    }
}


function startPaymentPolling(transactionId) {
    if (statusPollInterval) clearInterval(statusPollInterval);

    statusPollInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/check-status/${transactionId}`);
            const result = await response.json();

            if (result.status === "success" && result.order_status === "paid") {
                clearInterval(statusPollInterval);
                
                document.getElementById("paymentModal").style.display = "none";
                triggerSuccessAlert();
                sendTelegramAlert();
                
                // Recon simulation 
                console.log(`[SERVER CMD] /lp user ${currentOrder.ign} parent set ${currentOrder.value}`);
            }
        } catch (error) {
            console.error("Polling error:", error);
        }
    }, 4000);
}

async function sendTelegramAlert() {
    const message = `✅ *មានការទូទាត់ប្រាក់ថ្មីជោគជ័យ!*

`
                  + `👤 *ឈ្មោះអ្នកលេង:* ${currentOrder.ign}
`
                  + `🛍️ *ទំនិញ:* ${currentOrder.category.toUpperCase()} - ${currentOrder.value}
`
                  + `💰 *តម្លៃ:* $${currentOrder.price.toFixed(2)}
`
                  + `🎮 *Platform:* ${currentOrder.platform}

`
                  + `⚙️ ប្រព័ន្ធកំពុងបញ្ចូលយសទៅក្នុងហ្គេមដោយស្វ័យប្រវត្តិ។`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error("បញ្ហាក្នុងការផ្ញើសារទៅ Telegram:", e);
    }
}

function triggerSuccessAlert() {
    const alertModal = document.getElementById("successAlert");
    alertModal.style.display = "flex";
    setTimeout(() => { alertModal.classList.add("active"); }, 50);
}

function closeSuccessAlert() {
    const alertModal = document.getElementById("successAlert");
    alertModal.classList.remove("active");
    setTimeout(() => { 
        alertModal.style.display = "none"; 
        showPage('home'); // Return to home page
    }, 300);
}

function closeModal() {
    document.getElementById("paymentModal").style.display = "none";
    if (statusPollInterval) clearInterval(statusPollInterval);
                            }
        
