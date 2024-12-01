import { ref, onValue, update, set } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

// ---------------------------------- Range-Bar-Animation ----------------------------------
export function updateRangeBar(database) {
    const slider = document.getElementById("range");
    const value = document.querySelector(".value");

    // Lắng nghe sự thay đổi trên nút trượt từ Firebase
    onValue(ref(database, "Pump/value"), (snapshot) => {
        const firebaseValue = snapshot.val();
        slider.value = firebaseValue;
        value.textContent = firebaseValue;
    });

    // Xử lý sự kiện thay đổi trên nút trượt
    slider.oninput = function() {
        const water_pump = this.value;
        value.textContent = water_pump;

        // Cập nhật giá trị lên Firebase
        update(ref(database, "Pump"), { value: water_pump });
    };
}
// ---------------------------------- Button-get-value ----------------------------------
export function updateLedStatus(database) {
    const ledRef = ref(database, 'Led');
    const text = document.querySelector(".led");

    document.getElementById('check').addEventListener('change', function() {
        const isChecked = this.checked;

        update(ledRef, { status: isChecked ? "1" : "0" })
            .then(() => {
                console.log(`LED đã ${isChecked ? 'bật' : 'tắt'}`);
            })
            .catch((error) => {
                console.error("Cập nhật thất bại khi thay đổi LED: ", error);
            });
    });

    // Lắng nghe sự thay đổi từ Firebase và cập nhật giao diện
    onValue(ledRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.status === "1") {
            text.textContent = "Led: ON";
            document.getElementById('check').checked = true;
        } else {
            text.textContent = "Led: OFF";
            document.getElementById('check').checked = false;
        }
    });
}

// ---------------------------------- Data-get-value ----------------------------------
export function getTemperature(database) {
    const dbRef_temperature = ref(database, 'Temperature');
    const temperature = document.querySelector(".temperature.progress-value");
    const temperature_circularProgress = document.querySelector(".temperature.circular-progress");

    onValue(dbRef_temperature, (snapshot) => {
        const temperature_value = snapshot.val();
        temperature.textContent = `${temperature_value}°C`;
        temperature_circularProgress.style.background = `conic-gradient(#0CA1A6 ${temperature_value * 3.6}deg, #ccc 0deg)`;
    });

    const dbRef_humidity = ref(database, 'Humidity');
    const humidity = document.querySelector(".humidity.progress-value");
    const humidity_circularProgress = document.querySelector(".humidity.circular-progress");

    onValue(dbRef_humidity, (snapshot) => {
        const humidity_value = snapshot.val();
        humidity.textContent = `${humidity_value}%`;
        humidity_circularProgress.style.background = `conic-gradient(#0CA1A6 ${humidity_value * 3.6}deg, #ccc 0deg)`;
    });

    const dbRef_pH = ref(database, 'pH');
    const pH = document.querySelector(".pH.progress-value");
    const pH_circularProgress = document.querySelector(".pH.circular-progress");

    onValue(dbRef_pH, (snapshot) => {
        let pH_value = Number(snapshot.val()); // Đảm bảo chuyển đổi sang số

        // Kiểm tra và giới hạn giá trị pH
        if (pH_value > 14) {
            pH_value = 14; // Giới hạn pH tối đa là 14
            set(dbRef_pH, pH_value); // Cập nhật lại giá trị pH trong Firebase, không thêm biến value
        }

        pH.textContent = `${pH_value} pH`; // Đảm bảo pH_value là giá trị
        // Cập nhật góc cho vòng tròn (14 là giới hạn tối đa)
        pH_circularProgress.style.background = `conic-gradient(#0CA1A6 ${(pH_value / 14) * 360}deg, #ccc 0deg)`;
    });
}

// ---------------------------------- Alarm Status Update ----------------------------------
export function updateAlarmStatus(database) {
    const alarmRef = ref(database, 'Alarm');
    const alarmLabel = document.querySelector('.alarm-label');
    const img = document.querySelector('.alarm-image');

    alarmLabel.addEventListener('click', function() {
        const alarmStatus = img.src.includes('alarm1.png') ? "1" : "0";
        img.src = alarmStatus === "1" ? 'Assets/img/alarm2.png' : 'Assets/img/alarm1.png';

        // Cập nhật trạng thái alarm vào Firebase
        update(alarmRef, { status: alarmStatus })
            .then(() => {
                console.log("Trạng thái alarm đã được cập nhật");
            })
            .catch((error) => {
                console.error("Cập nhật thất bại khi cập nhật trạng thái alarm: ", error);
            });
    });

    // Lắng nghe sự thay đổi từ Firebase
    onValue(alarmRef, (snapshot) => {
        const data = snapshot.val();
        img.src = (data && data.status === "1") ? 'Assets/img/alarm2.png' : 'Assets/img/alarm1.png';
    });
}

// gửi dữ liệu lên ThingSpeak
function sendDataToThingSpeak(data) {
    const xhr = new XMLHttpRequest();
    const url = `https://api.thingspeak.com/update?api_key=NTKCR58Q0MKQPCA2&field1=${data.Temperature}&field2=${data.Humidity}&field3=${data.pH}`;
    xhr.open("GET", url, true);
    xhr.send();
}

// Lấy dữ liệu từ Firebase và cập nhật ThingSpeak
export function syncDataToThingSpeak(database) {
    const dataRef = ref(database, '/');
    let lastUpdateTime = 0; // Thời gian cập nhật cuối cùng

    onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // console.log('Dữ liệu từ Firebase:', data);
            const currentTime = Date.now();

            // Kiểm tra thời gian trước khi gửi dữ liệu
            if (currentTime - lastUpdateTime >= 7200000) { // Kiểm tra 2 giờ
                sendDataToThingSpeak(data);
                lastUpdateTime = currentTime; // Cập nhật thời gian gửi
            }
        } else {
            console.log('Không có dữ liệu từ Firebase.');
        }
    });
}