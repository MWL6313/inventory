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

// 🚀 讀取歷史資料並分組顯示
async function loadHistory() {
    const typeSelect = document.getElementById("historyType");
    if (!typeSelect) return;

    const type = typeSelect.value;
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

        const tableHeader = document.getElementById("tableHeader");
        const tableBody = document.getElementById("historyTable");
        tableHeader.innerHTML = "";
        tableBody.innerHTML = "";

        let headers, groupingKey, photoIndexes, personIndex;
        let isAbnormal = false;
        let extraFields = null; // 僅針對異常處理

        // 設定各類型資料欄位對應（原始資料中第一欄為任務名稱）
        if (type === "盤點") {
            // 原始資料：
            // 0=任務名稱, 1=點位或項次, 2=項目, 3=單位, 4=儲備數, 5=盤點數, 6=狀態, 7=備註, 8=照片連結, 9=負責人, 10=到點感應時間, 11=上傳時間, 12=部門
            headers = ["點位或項次", "項目", "單位", "儲備數", "盤點數", "狀態", "備註", "照片連結"];
            groupingKey = [0, 11];
            photoIndexes = [8]; // 照片連結位於 row[8]
            personIndex = 9;
        } else if (type === "巡檢") {
            // 原始資料：
            // 0=任務名稱, 1=點位或項次, 2=項目, 3=狀態, 4=備註, 5=照片連結, 6=負責人, 7=到點感應時間, 8=上傳時間, 9=部門
            headers = ["點位或項次", "項目", "狀態", "備註", "照片連結"];
            groupingKey = [0, 8];
            photoIndexes = [5]; // row[5]
            personIndex = 6;
        } else if (type === "異常處理") {
            // 原始資料：
            // 0=任務名稱, 1=點位或項次, 2=項目, 3=單位, 4=儲備量, 5=盤點量, 6=狀態, 7=備註, 8=照片連結, 9=負責人, 10=到點感應時間, 11=上傳時間, 12=處理狀態, 13=複查情形, 14=複查照片連結, 15=複查時間, 16=主管, 17=批准或退回, 18=主管意見, 19=確認時間, 20=處理紀錄, 21=部門
            // 主顯示部分僅顯示從點位或項次到照片連結 (即 row[1]~row[8])
            headers = ["點位或項次", "項目", "單位", "儲備量", "盤點量", "狀態", "備註", "照片連結"];
            groupingKey = [0, 11];
            photoIndexes = [8]; // 主照片欄位為 row[8]
            personIndex = 9;
            isAbnormal = true;
            extraFields = {
                extraHeaders: ["複查照片連結", "複查時間", "主管意見", "確認時間", "處理紀錄"],
                // 對應原始資料：複查照片連結: row[14], 複查時間: row[15], 主管意見: row[18], 確認時間: row[19], 處理紀錄: row[20]
                extraIndexes: [14, 15, 18, 19, 20]
            };
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
            let groupRows = groupedData[groupKey];
            let firstRow = groupRows[0]; // 群組代表
            let tr = document.createElement("tr");

            // 主展開按鈕
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

            // 群組資料：從群組 key 中取得任務名稱和上傳時間，負責人取第一筆記錄
            let [groupTaskName, groupUploadTime] = groupKey.split(" | ");
            [groupTaskName, groupUploadTime, firstRow[personIndex]].forEach(value => {
                let td = document.createElement("td");
                td.innerText = value;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);

            // 建立詳細表格 (子行)
            let detailRow = document.createElement("tr");
            detailRow.id = `group-${groupIndex}`;
            detailRow.style.display = "none";
            let detailTd = document.createElement("td");
            detailTd.colSpan = 4;

            let detailTable = document.createElement("table");
            detailTable.classList.add("detail-table");

            // 詳細表頭 (對於異常處理，額外欄位會另外顯示，不納入此表頭)
            let detailHeaderRow = document.createElement("tr");
            // 加入一個空白表頭以對齊展開按鈕
            let emptyTh = document.createElement("th");
            emptyTh.innerText = "";
            detailHeaderRow.appendChild(emptyTh);
            headers.forEach(h => {
                let th = document.createElement("th");
                th.innerText = h;
                detailHeaderRow.appendChild(th);
            });
            detailTable.appendChild(detailHeaderRow);

            // 填充每筆詳細資料
            groupRows.forEach((row, rowIndex) => {
                let subTr = document.createElement("tr");
                subTr.id = `sub-detail-${groupIndex}-${rowIndex}`;

                // 對於異常處理，第一欄加入額外展開按鈕以展開額外資訊
                if (isAbnormal) {
                    let extraToggleTd = document.createElement("td");
                    let extraToggleButton = document.createElement("button");
                    extraToggleButton.innerText = "＋";
                    extraToggleButton.classList.add("expand-btn");
                    extraToggleButton.onclick = function () {
                        let extraRow = document.getElementById(`sub-extra-${groupIndex}-${rowIndex}`);
                        if (!extraRow) return;
                        let isHidden = extraRow.style.display === "none";
                        extraRow.style.display = isHidden ? "table-row" : "none";
                        extraToggleButton.innerText = isHidden ? "－" : "＋";
                    };
                    extraToggleTd.appendChild(extraToggleButton);
                    subTr.appendChild(extraToggleTd);
                } else {
                    // 非異常處理則第一欄空白（保留對齊）
                    let emptyTd = document.createElement("td");
                    emptyTd.innerText = "";
                    subTr.appendChild(emptyTd);
                }

                // 填充詳細資料：從 row[1] 開始對應 headers
                headers.forEach((_, colIndex) => {
                    let td = document.createElement("td");
                    let cellData = row[colIndex + 1] || "";
                    if (photoIndexes.includes(colIndex + 1)) {
                        let imgContainer = document.createElement("div");
                        let imgLinks = cellData.split(",").filter(link => link.trim() !== "");
                        imgLinks.forEach(link => {
                            let img = document.createElement("img");
                            let imgUrl = convertGoogleDriveLink(link.trim());
                            img.src = imgUrl;
                            img.alt = "照片";
                            img.width = 50;
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

                // 如果異常處理，加入子行的子行顯示額外資訊（以表格形式）
                if (isAbnormal && extraFields) {
                    let extraTr = document.createElement("tr");
                    extraTr.id = `sub-extra-${groupIndex}-${rowIndex}`;
                    extraTr.style.display = "none";
                    let extraTd = document.createElement("td");
                    // 子行的子行跨越所有欄位：包括展開按鈕欄及 headers
                    extraTd.colSpan = headers.length + 1;
                    
                    // 建立一個內部表格顯示額外資訊
                    let extraTable = document.createElement("table");
                    extraTable.style.width = "100%";
                    extraTable.style.borderCollapse = "collapse";
                    let extraHeaderRow = document.createElement("tr");
                    extraFields.extraHeaders.forEach(header => {
                        let th = document.createElement("th");
                        th.innerText = header;
                        th.style.border = "1px solid #ccc";
                        th.style.padding = "5px";
                        extraHeaderRow.appendChild(th);
                    });
                    extraTable.appendChild(extraHeaderRow);
                    
                    let extraDataRow = document.createElement("tr");
                    extraFields.extraIndexes.forEach((index, idx) => {
                        let td = document.createElement("td");
                        td.innerText = row[index] || "";
                        td.style.border = "1px solid #ccc";
                        td.style.padding = "5px";
                        extraDataRow.appendChild(td);
                    });
                    extraTable.appendChild(extraDataRow);
                    
                    extraTd.appendChild(extraTable);
                    extraTr.appendChild(extraTd);
                    detailTable.appendChild(extraTr);
                }
            });

            detailTd.appendChild(detailTable);
            detailRow.appendChild(detailTd);
            tableBody.appendChild(detailRow);
        });
    } catch (error) {
        console.error("🔴[ERROR] 歷史資料載入錯誤：", error);
    }
}

// 🚀 將 Google Drive 連結轉為可預覽
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

