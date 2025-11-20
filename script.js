/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateButton = document.getElementById("generateRoutine");

document.addEventListener("DOMContentLoaded", loadSelectedProducts);
let messages =  [
  
];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;
const workerUrl = 'https://openai-worker.tthaque.workers.dev';
/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-name="${product.name}" data-brand="${product.brand}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="product-overlay">
        <p>${product.description}</p>
        </div>
    </div>
  `
    )
    .join("");
    requestAnimationFrame(() => {
    productsContainer.classList.add("visible");
  });

  productsContainer.addEventListener("click", (e) => {
    selectedProducts(e);
  });
}

function getSelectedProducts() {
  const container = document.getElementById("selectedProductsList");
  const products = [];

  container.querySelectorAll(":scope > div").forEach(item => {
    const name = item.dataset.name;
    const brand = item.dataset.brand;
    if(name && brand) products.push({name, brand});
  })

  return products;
}

function selectedProducts(e) {
  const card = e.target.closest(".product-card");
    const selectedContainer = document.getElementById("selectedProductsList");
    if(!card) { return };
   
    const name = card.dataset.name;
    if ([...selectedContainer.children].some(c => c.dataset.name === name)) return;
    const brand = card.dataset.brand;
    const item = document.createElement("div");
    item.dataset.name = name;
    item.dataset.brand = brand;

    item.innerHTML = `
      <div class="info">
      <h4>${brand} - ${name}</h4>
      <div><span class="material-symbols-outlined close-button" >
      close
      </span></div>
    `;
    selectedContainer.appendChild(item);
    const closeButton = item.querySelector(".close-button");
    closeButton.addEventListener("click", () => {
      item.remove();
      saveSelectedProducts();
    })
    saveSelectedProducts();
  }

function saveSelectedProducts() {
  const products = getSelectedProducts();
  localStorage.setItem("selectedProducts", JSON.stringify(products));
}

function loadSelectedProducts() {
  const saved = JSON.parse(localStorage.getItem("selectedProducts")) || [];
  const selectedContainer = document.getElementById("selectedProductsList");

  saved.forEach(({name, brand}) => {
    const item = document.createElement("div");
    item.dataset.name = name;
    item.dataset.brand = brand;

    item.innerHTML = `
      <div class="info">
        <h4>${brand} - ${name}</h4>
        <div><span class="material-symbols-outlined close-button">close</span></div>
      </div>
    `;

    selectedContainer.appendChild(item);

    item.querySelector(".close-button").addEventListener("click", () => {
      item.remove();
      saveSelectedProducts();
    });
  })
}
/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  main();
});

generateButton.addEventListener("click", main);
async function main() {
  const userBubble = document.createElement("div");
  userBubble.classList.add("chat-bubble", "user");
  let userText = userInput.value;

  if(userText) {
    userBubble.textContent = userInput.value;
    chatWindow.appendChild(userBubble);
  }
  
  const aiBubble = document.createElement("div");
  aiBubble.classList.add("chat-bubble", "ai");
  aiBubble.textContent = "Generating your perfect routine...";

  chatWindow.appendChild(aiBubble);
  const products = getSelectedProducts();
  const productList = products.map(p => `${p.name} - ${p.brand}`);
  console.log(productList);
  console.log(products);
  messages.unshift({
    role: 'system', content: `You are a friendly Loreal Product Assistant. Please create a personalized
      beauty routine using these products ${productList} Please remind the users of what products they selected
      and keep the routine short, sweet, and doable for the average person. Always use soft, aesthetic emojis when listing products or steps. 
      Avoid asterisks or markdown bullets. If the user has any follow-up questions, please respond happily and helpful. Use real-world data and provide links
      if needed to assist the user. Please rremove asterisks or markdown bullets for these links. If a user's query is unrelated to Loreal products, 
      respond by stating that you do not know. `
  })
  messages.push(
    {role: 'user', content: `Selected products: ${productList} User question: ${userInput.value}`}
  );
  
  const response = await fetch(workerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify( {
      messages: messages,
      web_search_options: {},
      temperature: 0.7,
      max_completion_tokens: 500
    })
  });
  const result = await response.json();
  messages.push({role: 'assistant', content: result.choices[0].message.content});
  aiText = result.choices[0].message.content;
  aiBubble.textContent = aiText;
  userInput.value = '';
  console.log(result);
};
