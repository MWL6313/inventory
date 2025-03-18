// 取得 API 基本 URL
const API_BASE_URL = "https://cloud-run-api-299116105630.asia-east1.run.app";  

// 🚀 登入功能
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

        let headers, groupingKey, photoIndexes, personIndex;

        if (type === "盤點") {
            // 原始資料：任務名稱, 點位或項次, 項目, 單位, 儲備數, 盤點數, 狀態, 備註, 照片連結, 負責人, 到點感應時間, 上傳時間, 部門
            headers = ["點位或項次", "項目", "單位", "儲備數", "盤點數", "狀態", "備註", "照片連結"];
            groupingKey = [0, 11]; // 以「任務名稱」(row[0]) + 「上傳時間」(row[11])分組
            photoIndexes = [8];     // 原始資料中，照片連結在第9欄
            personIndex = 9;        // 負責人在第10欄
        } else if (type === "巡檢") {
            // 原始資料：任務名稱, 點位或項次, 項目, 狀態, 備註, 照片連結, 負責人, 到點感應時間, 上傳時間, 部門
            headers = ["點位或項次", "項目", "狀態", "備註", "照片連結"];
            groupingKey = [0, 8];   // 任務名稱 (row[0]) + 上傳時間 (row[8])
            photoIndexes = [5];     // 照片連結在第6欄
            personIndex = 6;        // 負責人在第7欄
        } else if (type === "異常處理") {
            // 原始資料：任務名稱, 點位或項次, 項目, 單位, 儲備量, 盤點量, 狀態, 備註, 照片連結, 負責人, 到點感應時間, 上傳時間, 處理狀態, 複查情形, 複查照片連結, 複查時間, 主管, 批准或退回, 主管意見, 確認時間, 處理紀錄, 部門
            headers = ["點位或項次", "項目", "單位", "儲備量", "盤點量", "狀態", "備註", "照片連結", "複查照片連結"];
            groupingKey = [0, 11];  // 任務名稱 (row[0]) + 上傳時間 (row[11])
            photoIndexes = [8, 14]; // 照片連結在第9欄，複查照片連結在第15欄
            personIndex = 9;        // 負責人在第10欄
        }

        // 📌 **分組處理**
        let groupedData = {};
        data.slice(1).forEach(row => {
            let key = row[groupingKey[0]] + " | " + row[groupingKey[1]];
            if (!groupedData[key]) groupedData[key] = [];
            groupedData[key].push(row);
        });

        // 📌 **建立主表頭**
        let mainHeaderRow = document.createElement("tr");
        ["", "任務名稱", "上傳時間", "負責人"].forEach(header => {
            let th = document.createElement("th");
            th.innerText = header;
            mainHeaderRow.appendChild(th);
        });
        tableHeader.appendChild(mainHeaderRow);

        // 📌 **顯示分組資料**
        Object.keys(groupedData).forEach((groupKey, groupIndex) => {
            let firstRow = groupedData[groupKey][0]; // 分組中第一筆作為代表
            let tr = document.createElement("tr");

            // 🔹 **主展開按鈕**
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

            // 取出群組的任務名稱與上傳時間 (groupKey已包含任務名稱和上傳時間)
            let [groupTaskName, groupUploadTime] = groupKey.split(" | ");
            [groupTaskName, groupUploadTime, firstRow[personIndex]].forEach(value => {
                let td = document.createElement("td");
                td.innerText = value;
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);

            // 📌 **建立詳細表格 (子行)**
            let detailRow = document.createElement("tr");
            detailRow.id = `group-${groupIndex}`;
            detailRow.style.display = "none";

            let detailTd = document.createElement("td");
            detailTd.colSpan = 4;

            let detailTable = document.createElement("table");
            detailTable.classList.add("detail-table");

            // 🔹 **建立詳細表頭列**
            let detailHeaderRow = document.createElement("tr");
            headers.forEach(h => {
                let th = document.createElement("th");
                th.innerText = h;
                detailHeaderRow.appendChild(th);
            });
            detailTable.appendChild(detailHeaderRow);

            // 🔹 **填充每筆詳細資料**
            groupedData[groupKey].forEach((row, rowIndex) => {
                let subTr = document.createElement("tr");
                subTr.id = `sub-detail-${groupIndex}-${rowIndex}`; // 唯一 ID

                // 🔸 **子行展開按鈕**（用來展開更多細節，如果需要的話）
                let subExpandTd = document.createElement("td");
                let subExpandButton = document.createElement("button");
                subExpandButton.innerText = "＋";
                subExpandButton.classList.add("expand-btn");
                subExpandButton.onclick = function () {
                    let subDetailRow = document.getElementById(`sub-extra-${groupIndex}-${rowIndex}`);
                    if (!subDetailRow) return;
                    let isHidden = subDetailRow.style.display === "none";
                    subDetailRow.style.display = isHidden ? "table-row" : "none";
                    subExpandButton.innerText = isHidden ? "－" : "＋";
                };
                subExpandTd.appendChild(subExpandButton);
                subTr.appendChild(subExpandTd);

                // 🔸 **填充資料**（注意：資料欄位從 row[1] 開始對應 headers）
                headers.forEach((_, colIndex) => {
                    let td = document.createElement("td");
                    // 原始資料對應為 row[colIndex+1]，避免重複任務名稱
                    let cellData = row[colIndex + 1] || "";
                    if (photoIndexes.includes(colIndex + 1)) {
                        let imgContainer = document.createElement("div");
                        let imgLinks = cellData.split(",").filter(link => link.trim() !== "");
                        imgLinks.forEach(link => {
                            let img = document.createElement("img");
                            let imgUrl = convertGoogleDriveLink(link.trim());
                            img.src = imgUrl;
                            img.alt = "照片";
                            img.style.width = "50px";
                            img.style.margin = "2px";
                            img.style.cursor = "pointer";
                            img.onclick = () => window.open(link.trim(), "_blank");
                            imgContainer.appendChild(img);
                        });
                        td.appendChild(imgContainer);
                    } else {
                        td.innerText = cellData;
                    }
                    subTr.appendChild(td);
                });

                detailTable.appendChild(subTr);

                // 如果你需要展開更多細節，可以在此處建立額外的子行（例如 sub-extra-*）
                // 目前這裡沒有額外細節，所以不建立
            });

            detailTd.appendChild(detailTable);
            detailRow.appendChild(detailTd);
            tableBody.appendChild(detailRow);
        });
    } catch (error) {
        console.error("🔴[ERROR] 歷史資料載入錯誤：", error);
    }
}

// 🚀 **將 Google Drive 連結轉為可預覽**
function convertGoogleDriveLink(link) {
    if (!link) return "";
    let match = link.match(/[-\w]{25,}/);
    return match ? `https://drive.google.com/uc?export=view&id=${match[0]}` : "";
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

