// 取得 API 基本 URL
const API_BASE_URL = "https://cloud-run-api-299116105630.asia-east1.run.app";

// 🚀 登入功能（調整後，加入儲存 token）
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
            localStorage.setItem("token", data.token);
            localStorage.setItem("department", data.department);
            localStorage.setItem("role", data.role);
            // 使用 input 框中的帳號來存入 localStorage
            localStorage.setItem("account", account);
            window.location.href = "dashboard.html";
        } else {
            document.getElementById("message").innerText = "登入失敗，請檢查帳號或密碼";
        }
    } catch (error) {
        console.error("🔴[ERROR] 登入請求錯誤：", error);
        document.getElementById("message").innerText = "系統錯誤，請稍後再試";
    }
}



// 設定閒置超時時間：30 分鐘（以毫秒計算）
document.addEventListener("DOMContentLoaded", function() {
    // 設定閒置超時時間：30 分鐘（以毫秒計算）
    const idleTimeout = 30 * 60 * 1000; // 30 分鐘
    let lastActivity = Date.now(); // 最後活動時間
    let countdownInterval;

    // 重置閒置計時器
    function resetIdleTimer() {
        lastActivity = Date.now();
    }

    // 監聽常見使用者操作事件
    ["mousemove", "keydown", "scroll", "click"].forEach(event => {
        window.addEventListener(event, resetIdleTimer);
    });

    // 檢查閒置狀態並更新倒數顯示
    function checkIdle() {
        const now = Date.now();
        const elapsed = now - lastActivity;
        const remaining = idleTimeout - elapsed;
        
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            logout(); // 確保 logout() 函式已定義
        } else {
            // 計算剩餘分鐘與秒數
            let totalSeconds = Math.floor(remaining / 1000);
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = totalSeconds % 60;
            // 更新倒數顯示（格式：MM:SS）
            const countdownElement = document.getElementById("idleCountdown");
            if(countdownElement) {
                countdownElement.innerText = `自動登出倒數 ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            }
        }
    }

    // 啟動倒數檢查，每秒更新一次
    countdownInterval = setInterval(checkIdle, 1000);
});



// 更新右上角顯示的使用者資訊
function updateUserInfo() {
    const account = localStorage.getItem("account") || "未知帳號";
    const department = localStorage.getItem("department") || "未知部門";
    const role = localStorage.getItem("role") || "未知角色";
    // document.getElementById("userDetails").innerText = `帳號：${account} | 部門：${department} | 角色：${role}`;
    document.getElementById("userDetails").innerHTML = `帳號：${account} <br> 部門：${department} <br> 角色：${role}`;

}

// 登出功能：清除 localStorage 並導向登入頁面
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// 頁面載入時更新使用者資訊
updateUserInfo();


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

        let data = await response.json();
        console.log("🟢[DEBUG] 取得歷史資料回應", data);

        if (!Array.isArray(data) || data.length === 0) {
            console.warn("🟡[WARNING] 沒有可顯示的資料");
            return;
        }

        let tableHeader = document.getElementById("tableHeader");
        let tableBody = document.getElementById("historyTable");
        tableHeader.innerHTML = "";
        tableBody.innerHTML = "";

        let headers, groupingKey, photoIndexes, personIndex, deptIndex, repIndex;
        let isAbnormal = false;
        let extraFields = null; // 僅針對異常處理

        // 設定各類型資料對應欄位（原始資料中第一欄為任務名稱）
        if (type === "盤點") {
            // 0=任務名稱, 1=點位或項次, 2=項目, 3=單位, 4=儲備數, 5=盤點數, 6=狀態, 7=備註, 8=照片連結, 9=負責人, 10=到點感應時間, 11=上傳時間, 12=部門, 14=資料夾位置
            headers = ["點位或項次", "項目", "單位", "儲備數", "盤點數", "狀態", "備註", "照片連結"];
            groupingKey = [0, 11];
            photoIndexes = [8];
            personIndex = 9;
            deptIndex = 12;
            repIndex = 14;
        } else if (type === "巡檢") {
            // 0=任務名稱, 1=點位或項次, 2=項目, 3=狀態, 4=備註, 5=照片連結, 6=負責人, 7=到點感應時間, 8=上傳時間, 9=部門, 10=資料夾位置
            headers = ["點位或項次", "項目", "狀態", "備註", "照片連結"];
            groupingKey = [0, 8];
            photoIndexes = [5];
            personIndex = 6;
            deptIndex = 9;
            repIndex = 10;
        } else if (type === "異常處理") {
            // 0=任務名稱, 1=點位或項次, 2=項目, 3=單位, 4=儲備量, 5=盤點量, 6=狀態, 7=備註, 8=照片連結, 9=負責人, 10=到點感應時間, 11=上傳時間, 
            // 12=處理狀態, 13=複查情形, 14=複查照片連結, 15=複查時間, 16=主管, 17=批准或退回, 18=主管意見, 19=確認時間, 20=處理紀錄, 21=部門, 22=資料夾位置
            // 主顯示部分只顯示從點位或項次到照片連結 (即 row[1]~row[8])
            headers = ["點位或項次", "項目", "單位", "儲備量", "盤點量", "狀態", "備註", "照片連結"];
            groupingKey = [0, 11];
            photoIndexes = [8]; // 主照片連結在 row[8]
            personIndex = 9;
            deptIndex = 21;
            repIndex = 22;
            isAbnormal = true;
            extraFields = {
                extraHeaders: ["複查照片連結", "複查時間", "主管意見", "確認時間", "處理紀錄"],
                extraIndexes: [14, 15, 18, 19, 20]
            };
        }

        // ★★★ 新增：依據 localStorage 中的使用者部門過濾資料 ★★★
        const userDept = localStorage.getItem("department");
        // 保留第一筆標題，並過濾其他資料
        data = [data[0]].concat(data.slice(1).filter(row => row[deptIndex] === userDept));

        // 📌 分組處理：以「任務名稱 | 上傳時間」為 key
        let groupedData = {};
        data.slice(1).forEach(row => {
            let key = row[groupingKey[0]] + " | " + row[groupingKey[1]];
            if (!groupedData[key]) groupedData[key] = [];
            groupedData[key].push(row);
        });

        // 📌 建立主表頭 (6 欄：展開按鈕, 任務名稱, 上傳時間, 負責人, 部門, 資料夾位置)
        let mainHeaderRow = document.createElement("tr");
        ["", "任務名稱", "上傳時間", "負責人", "部門", "資料夾位置"].forEach(header => {
            let th = document.createElement("th");
            th.innerText = header;
            mainHeaderRow.appendChild(th);
        });
        tableHeader.appendChild(mainHeaderRow);

        // 📌 顯示分組資料
        Object.keys(groupedData).forEach((groupKey, groupIndex) => {
            let groupRows = groupedData[groupKey];
            let firstRow = groupRows[0];
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

            // 主表顯示：從群組 key取得任務名稱、上傳時間，再從第一筆記錄取負責人、部門及資料夾位置
            let [groupTaskName, groupUploadTime] = groupKey.split(" | ");
            let mainValues = [groupTaskName, groupUploadTime, firstRow[personIndex], firstRow[deptIndex], firstRow[repIndex]];
            mainValues.forEach((value, idx) => {
                let td = document.createElement("td");
                // 如果是資料夾位置 (最後一欄)
                if (idx === mainValues.length - 1 && value) {
                    let a = document.createElement("a");
                    a.href = value;
                    a.target = "_blank";
                    a.innerText = "報表位置";
                    td.appendChild(a);
                } else {
                    td.innerText = value;
                }
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);

            // 建立詳細表格 (子行)
            let detailRow = document.createElement("tr");
            detailRow.id = `group-${groupIndex}`;
            detailRow.style.display = "none";
            let detailTd = document.createElement("td");
            detailTd.colSpan = 6;  // 主表有6欄
            let detailTable = document.createElement("table");
            detailTable.classList.add("detail-table");

            // 詳細表頭 (第一欄對應展開按鈕)
            let detailHeaderRow = document.createElement("tr");
            let emptyTh = document.createElement("th");
            emptyTh.innerText = "";
            detailHeaderRow.appendChild(emptyTh);
            headers.forEach(h => {
                let th = document.createElement("th");
                th.innerText = h;
                detailHeaderRow.appendChild(th);
            });
            detailTable.appendChild(detailHeaderRow);

            // 填充每筆詳細資料 (子行)
            groupRows.forEach((row, rowIndex) => {
                let subTr = document.createElement("tr");
                subTr.id = `sub-detail-${groupIndex}-${rowIndex}`;

                // 若為異常處理，於第一欄加入額外展開按鈕；否則空白
                if (isAbnormal && extraFields) {
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
                    let emptyTd = document.createElement("td");
                    emptyTd.innerText = "";
                    subTr.appendChild(emptyTd);
                }

                // 填充詳細資料：從 row[1] 開始對應 headers（避免重複任務名稱）
                headers.forEach((_, colIndex) => {
                    let td = document.createElement("td");
                    let cellData = row[colIndex + 1] || "";
                    if (photoIndexes.includes(colIndex + 1)) {
                        if (cellData.trim() === "" || cellData.trim() === "未提供照片") {
                            td.innerText = "";
                        } else {
                            let imgContainer = document.createElement("div");
                            let imgLinks = cellData.split(",").filter(link => link.trim() !== "" && link.trim() !== "未提供照片");
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
                        }
                    } else {
                        td.innerText = cellData;
                    }
                    subTr.appendChild(td);
                });
                detailTable.appendChild(subTr);

                // 如果異常處理，加入子行的子行以內部表格形式顯示額外資訊
                if (isAbnormal && extraFields) {
                    let extraTr = document.createElement("tr");
                    extraTr.id = `sub-extra-${groupIndex}-${rowIndex}`;
                    extraTr.style.display = "none";
                    let extraTd = document.createElement("td");
                    extraTd.colSpan = headers.length + 1;
                    
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
                    extraFields.extraIndexes.forEach((extraIndex, idx) => {
                        let td = document.createElement("td");
                        if (extraFields.extraHeaders[idx] === "複查照片連結") {
                            let extraCell = row[extraIndex] || "";
                            if (extraCell.trim() === "" || extraCell.trim() === "未提供照片") {
                                td.innerText = "";
                            } else {
                                let imgContainer = document.createElement("div");
                                let imgLinks = extraCell.split(",").filter(link => link.trim() !== "" && link.trim() !== "未提供照片");
                                imgLinks.forEach(link => {
                                    let img = document.createElement("img");
                                    let imgUrl = convertGoogleDriveLink(link.trim());
                                    img.src = imgUrl;
                                    img.alt = "複查照片";
                                    img.width = 50;
                                    img.style.margin = "2px";
                                    img.style.cursor = "pointer";
                                    img.onclick = () => window.open(link.trim(), "_blank");
                                    imgContainer.appendChild(img);
                                });
                                td.appendChild(imgContainer);
                            }
                        } else {
                            td.innerText = row[extraIndex] || "";
                        }
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


/*------------------------------------------
  1. 取得待審核資料，並填入下拉選單
-------------------------------------------*/
// 全域變數用來存放待審核資料（API 回傳的陣列）
let reviewDataGlobal = [];


async function loadReviewData() {
    let role = localStorage.getItem("role");
    let department = localStorage.getItem("department");
    let account = localStorage.getItem("account"); // 登入帳號

    console.log("🔹[DEBUG] 取得主管審核資料", { role, department, account });

    if (!role || !department || !account) {
        console.error("🔴[ERROR] 角色、部門或帳號資訊缺失");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/pending-reviews`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": localStorage.getItem("token")
            },
            body: JSON.stringify({ role, department }),
        });

        const data = await response.json();
        console.log("🟢[DEBUG] 取得審核資料回應", data);

        // 若後端回傳 success 為 false，顯示訊息於下拉選單及詳細區塊，然後結束
        if (data.success === false) {
            let select = document.getElementById("reviewList");
            select.innerHTML = `<option value="">${data.message}</option>`;
            document.getElementById("reviewDetails").innerHTML = `<p>${data.message}</p>`;
            return;
        }

        // 將資料存入全域變數
        reviewDataGlobal = data;

        let select = document.getElementById("reviewList");
        select.innerHTML = "";

        if (data.length === 0) {
            select.innerHTML = `<option value="">目前沒有待審核的資料</option>`;
        } else {
            const taskNames = new Set();
            for (let i = 1; i < data.length; i++) {
                taskNames.add(data[i][0]);
            }
            taskNames.forEach(taskName => {
                let option = document.createElement("option");
                option.value = taskName;
                option.innerText = taskName;
                select.appendChild(option);
            });
        }

        if (select.value !== "") {
            displayReviewDetails(select.value);
        }

        select.addEventListener("change", function() {
            if (this.value !== "") {
                displayReviewDetails(this.value);
            }
        });

    } catch (error) {
        console.error("🔴[ERROR] 主管審核資料載入錯誤：", error);
    }
}


// 顯示任務詳細資料 (同時自動填入隱藏欄位)
// 顯示任務詳細資料 (同時自動填入隱藏欄位)
function displayReviewDetails(taskName) {
    if (!reviewDataGlobal || reviewDataGlobal.length === 0) return;

    const taskRows = reviewDataGlobal.slice(1).filter(row => row[0] === taskName);
    if (taskRows.length === 0) return;

    // 定義表格欄位
    const parentHeaders = ["展開", "任務名稱", "到點感應時間", "上傳時間", "負責人", "部門", "照片連結", "資料夾位置"];
    const childHeaders = ["展開", "點位或項次", "項目", "單位", "儲備量", "盤點量", "狀態", "備註"];
    const subchildHeaders = ["展開", "複查照片連結", "處理狀態", "複查情形", "複查時間", "主管意見", "確認時間", "處理紀錄"];
    const subchildWidths = ["5%", "10%", "10%", "10%", "10%", "10%", "10%", "35%"];

    const container = document.getElementById("reviewDetails");
    container.innerHTML = "";

    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.tableLayout = "fixed";

    // 父行標題
    let parentHeaderRow = document.createElement("tr");
    parentHeaders.forEach(text => {
        let th = document.createElement("th");
        th.innerText = text;
        th.style.border = "1px solid #ddd";
        th.style.padding = "8px";
        parentHeaderRow.appendChild(th);
    });
    table.appendChild(parentHeaderRow);

    // 父行資料
    let parentRow = document.createElement("tr");
    let expandTd = document.createElement("td");
    let parentExpandButton = document.createElement("button");
    parentExpandButton.innerText = "＋";
    parentExpandButton.classList.add("expand-btn");
    parentExpandButton.onclick = function () {
        let childSection = document.getElementById("childSection");
        childSection.style.display = childSection.style.display === "none" ? "table-row-group" : "none";
        parentExpandButton.innerText = childSection.style.display === "none" ? "＋" : "－";
    };
    expandTd.appendChild(parentExpandButton);
    parentRow.appendChild(expandTd);

    let parentValues = [
        taskRows[0][0],
        taskRows[0][10],
        taskRows[0][11],
        taskRows[0][9],
        taskRows[0][21],
        createThumbnail(taskRows[0][8]),
        taskRows[0][22] ? `<a href="${taskRows[0][22]}" target="_blank">報表位置</a>` : ""
    ];
    parentValues.forEach(value => {
        let td = document.createElement("td");
        td.innerHTML = value;
        td.style.border = "1px solid #ddd";
        td.style.padding = "8px";
        parentRow.appendChild(td);
    });
    table.appendChild(parentRow);

    // 子行區段
    let childSection = document.createElement("tbody");
    childSection.id = "childSection";
    childSection.style.display = "none";

    let childHeaderRow = document.createElement("tr");
    childHeaders.forEach(text => {
        let th = document.createElement("th");
        th.innerText = text;
        th.style.border = "1px solid #ddd";
        th.style.padding = "8px";
        childHeaderRow.appendChild(th);
    });
    childSection.appendChild(childHeaderRow);

    // taskRows.forEach((row, idx) => {
    //     // 建立子行
    //     let childRow = document.createElement("tr");
    //     let childExpandTd = document.createElement("td");
    //     let childExpandButton = document.createElement("button");
    //     childExpandButton.innerText = "＋";
    //     childExpandButton.onclick = () => {
    //         // 取得子行的子行區塊
    //         let subchildSection = document.getElementById(`subchildSection-${idx}`);
    //         if (subchildSection) {
    //             subchildSection.style.display = subchildSection.style.display === "none" ? "table-row-group" : "none";
    //             childExpandButton.innerText = subchildSection.style.display === "none" ? "＋" : "－";
    //         } else {
    //             console.warn(`未找到子行的子行區塊：subchildSection-${idx}`);
    //         }
    //     };
    //     childExpandTd.appendChild(childExpandButton);
    //     childRow.appendChild(childExpandTd);

    //     [1, 2, 3, 4, 5, 6, 7].forEach(i => {
    //         let td = document.createElement("td");
    //         td.innerText = row[i] || "";
    //         td.style.border = "1px solid #ddd";
    //         td.style.padding = "8px";
    //         childRow.appendChild(td);
    //     });
    //     childSection.appendChild(childRow);

    //     // --- 建立子行的子行區塊 ---
    //     let subchildRowWrapper = document.createElement("tr");
    //     subchildRowWrapper.id = `subchildSection-${idx}`;
    //     subchildRowWrapper.style.display = "none";
    //     let subchildCell = document.createElement("td");
    //     subchildCell.colSpan = parentHeaders.length; // 覆蓋整個表格的欄數

    //     // 建立內部子表格
    //     let innerTable = document.createElement("table");
    //     innerTable.style.width = "100%";
    //     innerTable.style.borderCollapse = "collapse";
    //     innerTable.style.tableLayout = "fixed";

    //     // 建立 colgroup
    //     let colgroup = document.createElement("colgroup");
    //     subchildWidths.forEach(width => {
    //         let col = document.createElement("col");
    //         col.style.width = width;
    //         colgroup.appendChild(col);
    //     });
    //     innerTable.appendChild(colgroup);

    //     // 建立內部表頭列
    //     let innerHeaderRow = document.createElement("tr");
    //     subchildHeaders.forEach(text => {
    //         let th = document.createElement("th");
    //         th.innerText = text;
    //         th.style.border = "1px solid #ddd";
    //         th.style.padding = "8px";
    //         innerHeaderRow.appendChild(th);
    //     });
    //     innerTable.appendChild(innerHeaderRow);

    //     // 建立內部資料列 (這裡以 row 的資料對應索引 [14, 12, 13, 15, 18, 19, 20] 為例)
    //     let innerDataRow = document.createElement("tr");
    //     // 第一欄預留（對應內部表頭中的「展開」）
    //     let emptyTd = document.createElement("td");
    //     emptyTd.innerText = "";
    //     innerDataRow.appendChild(emptyTd);
    //     let subchildIndices = [14, 12, 13, 15, 18, 19, 20];
    //     subchildIndices.forEach(i => {
    //         let td = document.createElement("td");
    //         td.innerText = row[i] || "";
    //         td.style.border = "1px solid #ddd";
    //         td.style.padding = "8px";
    //         innerDataRow.appendChild(td);
    //     });
    //     innerTable.appendChild(innerDataRow);

    //     subchildCell.appendChild(innerTable);
    //     subchildRowWrapper.appendChild(subchildCell);
    //     childSection.appendChild(subchildRowWrapper);
    // });

 taskRows.forEach((row, idx) => {
    // 建立子行
    let childRow = document.createElement("tr");
    let childExpandTd = document.createElement("td");
    let childExpandButton = document.createElement("button");
    childExpandButton.innerText = "＋";
    childExpandButton.onclick = () => {
        let subchildSection = document.getElementById(`subchildSection-${idx}`);
        if (subchildSection) {
            subchildSection.style.display = subchildSection.style.display === "none" ? "table-row-group" : "none";
            childExpandButton.innerText = subchildSection.style.display === "none" ? "＋" : "－";
        } else {
            console.warn(`未找到子行的子行區塊：subchildSection-${idx}`);
        }
    };
    childExpandTd.appendChild(childExpandButton);
    childRow.appendChild(childExpandTd);

    [1, 2, 3, 4, 5, 6, 7].forEach(i => {
        let td = document.createElement("td");
        td.innerText = row[i] || "";
        td.style.border = "1px solid #ddd";
        td.style.padding = "8px";
        childRow.appendChild(td);
    });
    childSection.appendChild(childRow);

    // --- 建立子行的子行區塊 ---
    let subchildRowWrapper = document.createElement("tr");
    subchildRowWrapper.id = `subchildSection-${idx}`;
    subchildRowWrapper.style.display = "none";

    let subchildCell = document.createElement("td");
    subchildCell.colSpan = childHeaders.length + 1;  // 確保它橫跨整個子行的寬度
    subchildCell.style.padding = "0px";

    // 建立內部子表格
    let innerTable = document.createElement("table");
    innerTable.style.width = "100%";
    innerTable.style.borderCollapse = "collapse";
    innerTable.style.tableLayout = "fixed";
    innerTable.style.margin = "10px 0"; // 讓它與子行有適當間距

    // 建立 colgroup
    let colgroup = document.createElement("colgroup");
    subchildWidths.forEach(width => {
        let col = document.createElement("col");
        col.style.width = width;
        colgroup.appendChild(col);
    });
    innerTable.appendChild(colgroup);

    // 建立內部表頭列
    let innerHeaderRow = document.createElement("tr");
    subchildHeaders.forEach(text => {
        let th = document.createElement("th");
        th.innerText = text;
        th.style.border = "1px solid #ddd";
        th.style.padding = "8px";
        th.style.background = "#f4f4f4";  // 讓標題列有區隔
        innerHeaderRow.appendChild(th);
    });
    innerTable.appendChild(innerHeaderRow);

    // 建立內部資料列
    let innerDataRow = document.createElement("tr");
    let subchildIndices = [14, 12, 13, 15, 18, 19, 20];
    subchildIndices.forEach(i => {
        let td = document.createElement("td");
        td.innerText = row[i] || "";
        td.style.border = "1px solid #ddd";
        td.style.padding = "8px";
        innerDataRow.appendChild(td);
    });
    innerTable.appendChild(innerDataRow);

    // **將內嵌表格放入子行的子行的 `<td>`**
    subchildCell.appendChild(innerTable);
    subchildRowWrapper.appendChild(subchildCell);
    childSection.appendChild(subchildRowWrapper);
});

    
    table.appendChild(childSection);
    container.appendChild(table);

    // 自動設定隱藏欄位
    document.getElementById("responsible").value = taskRows[0][9];  // 負責人 (J欄)
    document.getElementById("project").value = taskRows[0][2];      // 項目 (C欄)
    document.getElementById("uploadTime").value = taskRows[0][11];  // 上傳時間 (L欄)
    document.getElementById("account").value = localStorage.getItem("account") || "";
}


async function submitReview(decision) {
    const fields = ["reviewList", "comment", "account", "responsible", "project", "uploadTime"];
    const values = fields.map(id => document.getElementById(id).value.trim());
    const [taskName, comment, account, responsible, project, uploadTime] = values;

    if (values.some(val => !val)) {
        alert("請填寫所有必要資訊！");
        return;
    }

    document.getElementById("submitBtn").disabled = true;
    document.getElementById("spinner").style.display = 'block';

    try {
        const res = await fetch(`${API_BASE_URL}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                taskName, 
                decision, 
                comment, 
                role: localStorage.getItem("role"), 
                account, 
                responsible, 
                project, 
                uploadTime
            }),
        });
        const data = await res.json();
        alert(data.success ? `成功：${data.newStatus}` : `失敗：${data.message}`);
        if (data.success) location.reload();
    } catch (e) {
        alert("系統錯誤，稍後再試！");
    } finally {
        document.getElementById("submitBtn").disabled = false;
        document.getElementById("spinner").style.display = 'none';
    }
}

// 綁定 DOMContentLoaded 事件，確保所有元素載入後綁定按鈕事件
window.addEventListener("DOMContentLoaded", () => {
    loadReviewData();
    document.getElementById("submitBtn").addEventListener("click", () => submitReview('approve'));
    document.getElementById("submitBtnReject").addEventListener("click", () => submitReview('reject'));
});

// --------------------
// 輔助函式：轉換 Google Drive 連結為可預覽連結
function convertGoogleDriveLink(link) {
    if (!link) return "";
    let match = link.match(/[-\w]{25,}/);
    return match ? `https://drive.google.com/uc?export=view&id=${match[0]}` : "";
}

// 輔助函式：建立縮圖 HTML（以 img 元素）
function createThumbnail(link) {
    if (!link || link.trim() === "" || link.trim() === "未提供照片") {
        return "";
    }
    const convertedLink = convertGoogleDriveLink(link);
    return `<img src="${convertedLink}" alt="照片" width="50" style="margin:2px;cursor:pointer;" onclick="window.open('${link.trim()}', '_blank')">`;
}
