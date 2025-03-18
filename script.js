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
// 🚀 讀取歷史資料並分組顯示
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

        let headers, detailHeaders, groupingKey, photoIndex, personIndex;

        if (type === "盤點") {
            headers = ["項次", "項目", "單位", "儲備數", "盤點數", "狀態", "備註", "照片連結"];
            detailHeaders = ["盤點人", "到點感應時間", "上傳時間", "部門"];
            groupingKey = [0, 11]; // 任務名稱 + 上傳時間
            photoIndex = 7;
            personIndex = 8;
        } else if (type === "巡檢") {
            headers = ["點位或項次", "項目", "狀態", "備註", "照片連結"];
            detailHeaders = ["巡檢人", "到點感應時間", "上傳時間", "部門"];
            groupingKey = [0, 8];
            photoIndex = 4;
            personIndex = 5;
        } else if (type === "異常處理") {
            headers = ["點位或項次", "項目", "單位", "儲備量", "盤點量", "狀態", "備註", "照片連結"];
            detailHeaders = ["負責人", "到點感應時間", "上傳時間", "處理狀態"];
            groupingKey = [0, 11];
            photoIndex = 8;
            personIndex = 9;
        }

        // 📌 **分組處理**
        let groupedData = {};
        data.slice(1).forEach(row => {
            let key = row[groupingKey[0]] + " | " + row[groupingKey[1]];
            if (!groupedData[key]) groupedData[key] = [];
            groupedData[key].push(row);
        });

        // 📌 **建立表頭**
        let mainHeaderRow = document.createElement("tr");
        ["", "任務名稱", "上傳時間", "盤點人/負責人"].forEach(header => {
            let th = document.createElement("th");
            th.innerText = header;
            mainHeaderRow.appendChild(th);
        });
        tableHeader.appendChild(mainHeaderRow);

        // 📌 **顯示分組資料**
        Object.keys(groupedData).forEach((groupKey, groupIndex) => {
            let firstRow = groupedData[groupKey][0]; // 取出分組內第一筆資料
            let tr = document.createElement("tr");

            // 🔹 **展開按鈕**
            let expandTd = document.createElement("td");
            let expandButton = document.createElement("button");
            expandButton.innerText = "＋";
            expandButton.classList.add("expand-btn");
            expandButton.onclick = function () {
                let detailRow = document.getElementById(`group-${groupIndex}`);
                let isHidden = detailRow.style.display === "none";
                detailRow.style.display = isHidden ? "table-row" : "none";
                expandButton.innerText = isHidden ? "－" : "＋";
            };
            expandTd.appendChild(expandButton);
            tr.appendChild(expandTd);

            // 📌 **顯示組合欄位**
            let [taskName, uploadTime] = groupKey.split(" | ");
            [taskName, uploadTime, firstRow[personIndex]].forEach(value => {
                let td = document.createElement("td");
                td.innerText = value;
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);

            // 📌 **建立詳細表格**
            let detailRow = document.createElement("tr");
            detailRow.id = `group-${groupIndex}`;
            detailRow.style.display = "none";

            let detailTd = document.createElement("td");
            detailTd.colSpan = 4;

            let detailTable = document.createElement("table");
            detailTable.classList.add("detail-table");

            // 🔹 **建立標題列**
            let detailHeaderRow = document.createElement("tr");
            ["", ...headers].forEach(header => {
                let th = document.createElement("th");
                th.innerText = header;
                detailHeaderRow.appendChild(th);
            });
            detailTable.appendChild(detailHeaderRow);

            // 🔹 **填充數據**
            groupedData[groupKey].forEach((row, rowIndex) => {
                let subTr = document.createElement("tr");

                // 🔸 **展開按鈕**
                let subExpandTd = document.createElement("td");
                let subExpandButton = document.createElement("button");
                subExpandButton.innerText = "＋";
                subExpandButton.classList.add("expand-btn");
                subExpandButton.onclick = function () {
                    let subDetailRow = document.getElementById(`sub-${groupIndex}-${rowIndex}`);
                    let isHidden = subDetailRow.style.display === "none";
                    subDetailRow.style.display = isHidden ? "table-row" : "none";
                    subExpandButton.innerText = isHidden ? "－" : "＋";
                };
                subExpandTd.appendChild(subExpandButton);
                subTr.appendChild(subExpandTd);

                // 🔸 **填充主要數據**
                headers.forEach((_, colIndex) => {
                    let td = document.createElement("td");
                    if (colIndex === photoIndex - 1) {
                        let img = document.createElement("img");
                        img.src = convertGoogleDriveLink(row[photoIndex]);
                        img.alt = "照片";
                        img.style.width = "50px";
                        img.style.cursor = "pointer";
                        img.onclick = () => window.open(row[photoIndex], "_blank");
                        td.appendChild(img);
                    } else {
                        td.innerText = row[colIndex] || "";
                    }
                    subTr.appendChild(td);
                });
                detailTable.appendChild(subTr);

                // 🔸 **填充詳細資訊**
                let subDetailRow = document.createElement("tr");
                subDetailRow.id = `sub-${groupIndex}-${rowIndex}`;
                subDetailRow.style.display = "none";

                let subDetailTd = document.createElement("td");
                subDetailTd.colSpan = headers.length + 1;
                subDetailTd.innerText = "🔹 詳細資訊：" + detailHeaders.map((h, i) => `${h}: ${row[photoIndex + i + 1] || "N/A"}`).join(" | ");
                subDetailRow.appendChild(subDetailTd);
                detailTable.appendChild(subDetailRow);
            });

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
    let match = link ? link.match(/\/d\/(.*?)(\/|$)/) : null;
    return match ? `https://drive.google.com/uc?id=${match[1]}` : "https://via.placeholder.com/50";
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

