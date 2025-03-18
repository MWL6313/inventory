// 取得 API 基本 URL
const API_BASE_URL = "https://cloud-run-api-299116105630.asia-east1.run.app";  // 替換為你的 Cloud Run API URL;

// 🚀 1. 登入功能
async function login() {
    let account = document.getElementById("account").value.trim();
    let password = document.getElementById("password").value.trim();

    console.log("🔹[DEBUG] 嘗試登入", { account, password });

    if (!account || !password) {
        document.getElementById("message").innerText = "請輸入帳號與密碼";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account, password }),
        });

        const data = await response.json();
        console.log("🟢[DEBUG] 登入 API 回應", data);

        if (data.success) {
            localStorage.setItem("department", data.department);
            localStorage.setItem("role", data.role);
            window.location.href = "dashboard.html";
        } else {
            document.getElementById("message").innerText = "登入失敗，請檢查帳號或密碼";
        }
    } catch (error) {
        console.error("🔴[ERROR] 登入請求錯誤：", error);
        document.getElementById("message").innerText = "系統錯誤，請稍後再試";
    }
}

// 🚀 2. 讀取歷史資料
// 🚀 讀取歷史資料（並修正 Google Drive 照片連結）
async function loadHistory() {
    let typeSelect = document.getElementById("historyType");
    if (!typeSelect) return;

    let type = typeSelect.value;
    console.log("🔹[DEBUG] 讀取歷史資料 - 類型:", type);

    try {
        const response = await fetch(`${API_BASE_URL}/history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type }),
        });

        const data = await response.json();
        console.log("🟢[DEBUG] 取得歷史資料回應", data);

        if (!Array.isArray(data) || data.length === 0) {
            console.warn("🟡[WARNING] 沒有可顯示的資料");
            return;
        }

        let tableHeader = document.getElementById("tableHeader");
        let tableBody = document.getElementById("historyTable");

        tableHeader.innerHTML = "";
        tableBody.innerHTML = "";

        let headers, detailHeaders;
        let photoIndex;

        if (type === "盤點") {
            headers = ["", "任務名稱", "項次", "項目", "單位", "儲備數", "盤點數", "狀態", "備註"];
            detailHeaders = ["照片連結", "盤點人", "到點感應時間", "上傳時間", "部門"];
            photoIndex = 8; // 照片連結的索引
        } else if (type === "巡檢") {
            headers = ["", "任務名稱", "點位或項次", "項目", "狀態", "備註"];
            detailHeaders = ["照片連結", "巡檢人", "到點感應時間", "上傳時間", "部門"];
            photoIndex = 5;
        } else if (type === "異常處理") {
            headers = ["", "任務名稱", "點位或項次", "項目", "單位", "儲備量", "盤點量", "狀態", "備註"];
            detailHeaders = [
                ["照片連結", "負責人", "到點感應時間", "上傳時間", "處理狀態"],
                ["複查情形", "複查照片連結", "複查時間", "主管"],
                ["批准或退回", "主管意見", "確認時間", "處理紀錄", "部門"]
            ];
            photoIndex = 9;
        }

        // 📌 **建立表頭**
        let headerRow = document.createElement("tr");
        headers.forEach(header => {
            let th = document.createElement("th");
            th.innerText = header;
            headerRow.appendChild(th);
        });
        tableHeader.appendChild(headerRow);

        // 📌 **生成資料行**
        data.slice(1).forEach((row, index) => {
            let tr = document.createElement("tr");

            // 🔹 **展開按鈕**
            let expandTd = document.createElement("td");
            let expandButton = document.createElement("button");
            expandButton.innerText = "＋";
            expandButton.classList.add("expand-btn");
            expandButton.onclick = function () {
                let detailRow = document.getElementById(`detail-${index}`);
                let isHidden = detailRow.style.display === "none";
                detailRow.style.display = isHidden ? "table-row" : "none";
                expandButton.innerText = isHidden ? "－" : "＋";
            };
            expandTd.appendChild(expandButton);
            tr.appendChild(expandTd);

            // 📌 **顯示主要欄位**
            headers.slice(1).forEach((_, colIndex) => {
                let td = document.createElement("td");
                td.innerText = row[colIndex] || "";
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);

            // 📌 **建立詳細資訊行**
            let detailRow = document.createElement("tr");
            detailRow.id = `detail-${index}`;
            detailRow.style.display = "none";

            let detailTd = document.createElement("td");
            detailTd.colSpan = headers.length;

            let detailTable = document.createElement("table");
            detailTable.classList.add("detail-table");

            if (type === "異常處理") {
                detailHeaders.forEach(rowGroup => {
                    let detailHeaderRow = document.createElement("tr");
                    rowGroup.forEach(header => {
                        let th = document.createElement("th");
                        th.innerText = header;
                        detailHeaderRow.appendChild(th);
                    });
                    detailTable.appendChild(detailHeaderRow);

                    let detailDataRow = document.createElement("tr");
                    rowGroup.forEach((_, colIndex) => {
                        let td = document.createElement("td");
                        if (rowGroup[colIndex].includes("照片")) {
                            let img = document.createElement("img");
                            img.src = convertGoogleDriveLink(row[photoIndex + colIndex]);
                            img.alt = "照片";
                            img.style.width = "50px";
                            img.style.cursor = "pointer";
                            img.onclick = () => window.open(row[photoIndex + colIndex], "_blank");
                            td.appendChild(img);
                        } else {
                            td.innerText = row[photoIndex + colIndex] || "";
                        }
                        detailDataRow.appendChild(td);
                    });
                    detailTable.appendChild(detailDataRow);
                });
            } else {
                let detailHeaderRow = document.createElement("tr");
                detailHeaders.forEach(header => {
                    let th = document.createElement("th");
                    th.innerText = header;
                    detailHeaderRow.appendChild(th);
                });
                detailTable.appendChild(detailHeaderRow);

                let detailDataRow = document.createElement("tr");
                detailHeaders.forEach((_, colIndex) => {
                    let td = document.createElement("td");
                    if (colIndex === 0) {
                        let img = document.createElement("img");
                        img.src = convertGoogleDriveLink(row[photoIndex]);
                        img.alt = "照片";
                        img.style.width = "50px";
                        img.style.cursor = "pointer";
                        img.onclick = () => window.open(row[photoIndex], "_blank");
                        td.appendChild(img);
                    } else {
                        td.innerText = row[photoIndex + colIndex] || "";
                    }
                    detailDataRow.appendChild(td);
                });
                detailTable.appendChild(detailDataRow);
            }

            detailTd.appendChild(detailTable);
            detailRow.appendChild(detailTd);
            tableBody.appendChild(detailRow);
        });
    } catch (error) {
        console.error("🔴[ERROR] 歷史資料載入錯誤：", error);
    }
}

// 🔹 **Google Drive 連結轉換**
function convertGoogleDriveLink(link) {
    if (!link || !link.includes("drive.google.com")) return "https://via.placeholder.com/50";

    let match = link.match(/\/d\/(.*?)(\/|$)/);
    return match ? `https://drive.google.com/uc?id=${match[1]}` : "https://via.placeholder.com/50";
}


// 🚀 3. 主管審核 - 取得資料
async function loadReviewData() {
    let role = localStorage.getItem("role");
    let department = localStorage.getItem("department");

    console.log("🔹[DEBUG] 取得主管審核資料", { role, department });

    if (!role || !department) {
        console.error("🔴[ERROR] 角色或部門資訊缺失");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/pending-reviews`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token")  // 需包含 Token
            },
            body: JSON.stringify({ role, department }),
        });

        const data = await response.json();
        console.log("🟢[DEBUG] 取得審核資料回應", data);

        if (!Array.isArray(data)) {
            console.error("🔴[ERROR] API 回傳的數據不是陣列格式:", data);
            return;
        }

        let select = document.getElementById("reviewList");
        if (!select) return;

        select.innerHTML = "";
        data.forEach(row => {
            let option = document.createElement("option");
            option.value = row[0];
            option.innerText = row[0];
            select.appendChild(option);
        });
    } catch (error) {
        console.error("🔴[ERROR] 主管審核資料載入錯誤：", error);
    }
}


// 🚀 4. 主管審核 - 提交
async function submitReview(decision) {
    let taskName = document.getElementById("reviewList").value;
    let comment = document.getElementById("comment").value.trim();
    let role = localStorage.getItem("role");
    let department = localStorage.getItem("department");

    console.log("🔹[DEBUG] 提交審核", { taskName, decision, comment, role, department });

    if (!taskName || !comment) {
        alert("請選擇任務並輸入審核意見");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskName, decision, comment, role, department }),
        });

        const data = await response.json();
        console.log("🟢[DEBUG] 提交審核回應", data);

        if (data.success) {
            alert("審核成功，新的狀態：" + data.newStatus);
            location.reload();
        } else {
            alert("審核失敗：" + data.message);
        }
    } catch (error) {
        console.error("🔴[ERROR] 審核提交錯誤：", error);
        alert("系統錯誤，請稍後再試");
    }
}

