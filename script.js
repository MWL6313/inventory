const GAS_API_URL = "https://https://script.google.com/macros/s/AKfycbw004TPBGbRO2W5qh_jEH1KJqsYDVvK_NXDHrds6AXoxr116PpB1hEG3j-Hscz5cnPK7Q/exec.google.com/macros/s/YOUR_GAS_DEPLOY_ID/exec";

document.addEventListener("DOMContentLoaded", function () {
    fetchLinks();
});

function fetchLinks() {
    fetch(GAS_API_URL)
        .then(response => response.json())
        .then(data => {
            renderLinks(data);
            renderCategories(data);
        })
        .catch(error => console.error("Error fetching data:", error));
}

function renderLinks(links) {
    const container = document.getElementById("link-container");
    container.innerHTML = "";

    links.forEach(link => {
        let a = document.createElement("a");
        a.href = link.url;
        a.dataset.category = link.category;
        a.innerHTML = `
            ${link.icon ? `<img src="${link.icon}" alt="${link.text}">` : ""}
            ${link.text}
        `;
        container.appendChild(a);
    });
}

function renderCategories(links) {
    const categories = ["全部", ...new Set(links.map(link => link.category))];
    const filterContainer = document.getElementById("category-filter");
    filterContainer.innerHTML = "";

    categories.forEach(category => {
        let button = document.createElement("button");
        button.innerText = category;
        button.onclick = () => filterByCategory(category);
        if (category === "全部") button.classList.add("active");
        filterContainer.appendChild(button);
    });
}

function filterByCategory(category) {
    const links = document.querySelectorAll("#link-container a");
    links.forEach(link => {
        if (category === "全部" || link.dataset.category === category) {
            link.style.display = "flex";
        } else {
            link.style.display = "none";
        }
    });

    document.querySelectorAll(".category-filter button").forEach(btn => {
        btn.classList.toggle("active", btn.innerText === category);
    });
}

function filterLinks() {
    const searchInput = document.getElementById("search-input").value.toLowerCase();
    const links = document.querySelectorAll("#link-container a");

    links.forEach(link => {
        if (link.textContent.toLowerCase().includes(searchInput)) {
            link.style.display = "flex";
        } else {
            link.style.display = "none";
        }
    });
}
