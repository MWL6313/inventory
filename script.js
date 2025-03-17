// 取得 API 基本 URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbwQ1xowkF77bh7N4_rA5WuZtq0xVk3Tp3XM_sj9fhmz9s80EKQmmQU16l92wF8_8rLG/exec";

// 🚀 1. 登入功能
function login() {
    let account = document.getElementById("account").value.trim();
    let password = document.getElementById("password").value.trim();

    if (!account || !password) {
        document.getElementById("message").innerText = "請輸入帳號與密碼";
        return;
    }

    fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({ action: "loginUser", account: account, password: password }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem("department", data.department);
            localStorage.setItem("role", data.role);
            window.location.href = "dashboard.html";
        } else {
            document.getElementById("message").innerText = "登入失敗，請檢查帳號或密碼";
        }
    })
    .catch(error => {
        console.error("登入請求錯誤：", error);
        document.getElementById("message").innerText = "系統錯誤，請稍後再試";
    });
}

// 🚀 2. 讀取歷史資料
function loadHistory() {
    let typeSelect = document.getElementById("historyType");
    if (!typeSelect) return;
    
    let type = typeSelect.value; // 取得選擇的類型

    fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({ action: "getHistoryData", type: type }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        let tableHeader = document.getElementById("tableHeader");
        let tableBody = document.getElementById("historyTable");

        tableHeader.innerHTML = "";
        tableBody.innerHTML = "";

        // 設定表頭
        let headers = [];
        if (type === "盤點") {
            headers = ["任務名稱", "項次", "項目", "單位", "儲備數", "盤點數", "狀態", "備註", "照片連結", "盤點人", "到點感應時間", "上傳時間", "部門"];
        } else if (type === "巡檢") {
            headers = ["任務名稱", "點位或項次", "項目", "狀態", "備註", "照片連結", "巡檢人", "到點感應時間", "上傳時間", "部門"];
        } else if (type === "異常處理") {
            headers = ["任務名稱", "點位或項次", "項目", "單位", "儲備量", "盤點量", "狀態", "備註", "照片連結", "負責人", "到點感應時間", "上傳時間", "處理狀態", "複查情形", "複查照片連結", "複查時間", "主管", "批准或退回", "主管意見", "確認時間", "處理紀錄", "部門"];
        }

        // 生成表頭
        let headerRow = document.createElement("tr");
        headers.forEach(header => {
            let th = document.createElement("th");
            th.innerText = header;
            headerRow.appendChild(th);
        });
        tableHeader.appendChild(headerRow);

        // 填充表格數據
        data.forEach((row, index) => {
            if (index === 0) return; // 跳過標題列
            let tr = document.createElement("tr");
            row.forEach(cell => {
                let td = document.createElement("td");
                td.innerText = cell;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    })
    .catch(error => console.error("歷史資料載入錯誤：", error));
}

// 🚀 3. 主管審核 - 取得資料
function loadReviewData() {
    let role = localStorage.getItem("role");
    let department = localStorage.getItem("department");

    if (!role || !department) {
        console.error("角色或部門資訊缺失");
        return;
    }

    fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({ action: "getPendingReviews", role: role, department: department }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        let select = document.getElementById("reviewList");
        if (!select) return;

        select.innerHTML = "";
        data.forEach(row => {
            let option = document.createElement("option");
            option.value = row[0]; // 任務名稱
            option.innerText = row[0];
            select.appendChild(option);
        });
    })
    .catch(error => console.error("主管審核資料載入錯誤：", error));
}

// 🚀 4. 主管審核 - 提交
function submitReview(decision) {
    let taskName = document.getElementById("reviewList").value;
    let comment = document.getElementById("comment").value.trim();
    let role = localStorage.getItem("role");
    let department = localStorage.getItem("department");

    if (!taskName || !comment) {
        alert("請選擇任務並輸入審核意見");
        return;
    }

    fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({
            action: "approveReview",
            taskName: taskName,
            decision: decision,
            comment: comment,
            role: role,
            department: department
        }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("審核成功，新的狀態：" + data.newStatus);
            location.reload();
        } else {
            alert("審核失敗：" + data.message);
        }
    })
    .catch(error => {
        console.error("審核提交錯誤：", error);
        alert("系統錯誤，請稍後再試");
    });
}

