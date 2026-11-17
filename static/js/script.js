document.addEventListener("DOMContentLoaded", function () {

    // AQUASENSE AI - DEMO DATA
    const DEFAULT_WATER_LEVEL = 72;
    const TANK_CAPACITY = 1000;

    function getSaved(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function saveData(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // PUMP CONTROL
    const pumpStatus = document.getElementById("pumpStatus");
    const pumpMessage = document.getElementById("pumpMessage");
    const pumpOn = document.getElementById("pumpOn");
    const pumpOff = document.getElementById("pumpOff");

    let pumpIsOn = getSaved("aquaPump", false);

    function updatePumpDisplay() {
        if (pumpStatus) {
            pumpStatus.textContent = pumpIsOn ? "ON" : "OFF";
        }

        if (pumpMessage) {
            pumpMessage.textContent = pumpIsOn
                ? "Pump is running in simulation mode."
                : "Pump is currently stopped.";
        }

        if (pumpOn) {
            pumpOn.disabled = pumpIsOn;
        }

        if (pumpOff) {
            pumpOff.disabled = !pumpIsOn;
        }

        saveData("aquaPump", pumpIsOn);
    }

    if (pumpOn) {
        pumpOn.addEventListener("click", function () {
            const waterLevel = getSaved("aquaWaterLevel", DEFAULT_WATER_LEVEL);

            if (waterLevel <= 0) {
                alert("Cannot start the pump. The tank is empty.");
                return;
            }

            pumpIsOn = true;
            updatePumpDisplay();
        });
    }

    if (pumpOff) {
        pumpOff.addEventListener("click", function () {
            pumpIsOn = false;
            updatePumpDisplay();
        });
    }

    updatePumpDisplay();

    // IRRIGATION SCHEDULING
    const scheduleForm = document.getElementById("scheduleForm");
    const scheduleList = document.getElementById("scheduleList");
    const scheduleMessage = document.getElementById("scheduleMessage");

    let schedules = getSaved("aquaSchedules", []);

    function showSchedules() {
        if (!scheduleList) return;

        scheduleList.innerHTML = "";

        if (schedules.length === 0) {
            scheduleList.innerHTML =
                '<p class="small-note">No irrigation schedules added yet.</p>';
            return;
        }

        schedules.forEach(function (schedule, index) {
            const item = document.createElement("div");
            item.className = "schedule-item";

            const details = document.createElement("div");
            const heading = document.createElement("strong");
            const description = document.createElement("p");
            const status = document.createElement("span");
            const removeButton = document.createElement("button");

            heading.textContent = schedule.zone;
            description.textContent =
                schedule.date + " at " + schedule.time +
                " · " + schedule.duration + " minutes";

            status.className = "zone-status";
            status.textContent = schedule.status || "Scheduled";

            removeButton.type = "button";
            removeButton.className = "secondary-button";
            removeButton.textContent = "Remove";

            removeButton.addEventListener("click", function () {
                schedules.splice(index, 1);
                saveData("aquaSchedules", schedules);
                showSchedules();
            });

            details.appendChild(heading);
            details.appendChild(description);
            item.appendChild(details);
            item.appendChild(status);
            item.appendChild(removeButton);

            scheduleList.appendChild(item);
        });
    }

    if (scheduleForm) {
        const dateInput = document.getElementById("scheduleDate");
        const today = new Date();
        const localToday = new Date(
            today.getTime() - today.getTimezoneOffset() * 60000
        ).toISOString().split("T")[0];

        dateInput.min = localToday;

        scheduleForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const zone = document.getElementById("zoneSelect").value;
            const date = dateInput.value;
            const time = document.getElementById("scheduleTime").value;
            const duration = Number(
                document.getElementById("duration").value
            );

            if (!zone || !date || !time || duration < 1 || duration > 240) {
                alert("Please enter valid irrigation schedule details.");
                return;
            }

            const scheduledDate = new Date(date + "T" + time);

            if (scheduledDate <= new Date()) {
                alert("Please select a future date and time.");
                return;
            }

            schedules.push({
                zone: zone,
                date: date,
                time: time,
                duration: duration,
                status: "Scheduled",
                started: false
            });

            saveData("aquaSchedules", schedules);
            showSchedules();
            scheduleForm.reset();

            if (scheduleMessage) {
                scheduleMessage.textContent =
                    "Irrigation schedule saved successfully.";
            }
        });
    }

    showSchedules();

    // AUTOMATIC SCHEDULE SIMULATION
    // The browser tab must remain open for this demo check to run.
    function checkSchedules() {
        const now = new Date();

        schedules.forEach(function (schedule) {
            const startTime = new Date(
                schedule.date + "T" + schedule.time
            );

            const endTime = new Date(
                startTime.getTime() + schedule.duration * 60000
            );

            if (
                !schedule.started &&
                schedule.status === "Scheduled" &&
                now >= startTime &&
                now < endTime
            ) {
                schedule.started = true;
                schedule.status = "Running";

                const waterLevel = getSaved(
                    "aquaWaterLevel",
                    DEFAULT_WATER_LEVEL
                );

                if (waterLevel > 0) {
                    pumpIsOn = true;
                    saveData("aquaPump", true);
                } else {
                    schedule.status = "Skipped - Tank Empty";
                }
            }

            if (
                schedule.started &&
                schedule.status === "Running" &&
                now >= endTime
            ) {
                schedule.status = "Completed";
                pumpIsOn = false;
                saveData("aquaPump", false);
            }
        });

        saveData("aquaSchedules", schedules);
        updatePumpDisplay();
        showSchedules();
    }

    checkSchedules();
    setInterval(checkSchedules, 10000);

    // SETTINGS
    const saveSettingsButton = document.getElementById("saveSettings");

    if (saveSettingsButton) {
        const farmName = document.getElementById("farmName");
        const tankCapacity = document.getElementById("tankCapacity");
        const zoneCount = document.getElementById("zoneCount");
        const waterThreshold = document.getElementById("waterThreshold");
        const settingsMessage = document.getElementById("settingsMessage");

        farmName.value = getSaved("aquaFarmName", farmName.value);
        tankCapacity.value = getSaved("aquaTankCapacity", tankCapacity.value);
        zoneCount.value = getSaved("aquaZoneCount", zoneCount.value);
        waterThreshold.value = getSaved(
            "aquaWaterThreshold",
            waterThreshold.value
        );

        saveSettingsButton.addEventListener("click", function () {
            if (
                !farmName.value.trim() ||
                Number(tankCapacity.value) <= 0 ||
                Number(zoneCount.value) <= 0 ||
                Number(waterThreshold.value) < 1 ||
                Number(waterThreshold.value) > 100
            ) {
                alert("Please enter valid settings.");
                return;
            }

            saveData("aquaFarmName", farmName.value.trim());
            saveData("aquaTankCapacity", Number(tankCapacity.value));
            saveData("aquaZoneCount", Number(zoneCount.value));
            saveData("aquaWaterThreshold", Number(waterThreshold.value));

            settingsMessage.textContent = "Settings saved successfully.";
        });
    }

    // CSV REPORT DOWNLOAD
    const downloadReport = document.getElementById("downloadReport");

    if (downloadReport) {
        downloadReport.addEventListener("click", function () {
            const rows = [
                ["Farm Zone", "Water Used (Litres)", "Share of Usage"],
                ["Vegetable Farm", 80, "44.4%"],
                ["Fruit Garden", 50, "27.8%"],
                ["Crop Field", 50, "27.8%"],
                ["Total", 180, "100%"]
            ];

            const csvContent = rows.map(function (row) {
                return row.join(",");
            }).join("\n");

            const file = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;"
            });

            const link = document.createElement("a");
            const url = URL.createObjectURL(file);

            link.href = url;
            link.download = "AquaSense_Water_Usage_Report.csv";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        });
    }

});