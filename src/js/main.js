document.addEventListener("DOMContentLoaded", () => {
	const setupForm = document.getElementById("setup-form");
	const inputScreen = document.getElementById("input-screen");
	const simulationScreen = document.getElementById("simulation-screen");

	let lifts = [];
	let numFloors = 0;
	let FLOOR_HEIGHT = 80; // pixels
	const MOVE_TIME_PER_FLOOR = 2; // seconds
	const DOOR_ANIMATION_TIME = 2; // seconds
	let liftRequests = []; // Queue for lift requests

	setupForm.addEventListener("submit", (e) => {
		e.preventDefault();
		const numLifts = parseInt(document.getElementById("num-lifts").value);
		numFloors = parseInt(document.getElementById("num-floors").value);

		inputScreen.style.display = "none";
		simulationScreen.style.display = "block";

		createSimulation(numLifts, numFloors);
	});

	function createSimulation(numLifts, numFloors) {
		simulationScreen.innerHTML = "";
		updateFloorHeight();
		// simulationScreen.style.height = `${numFloors * FLOOR_HEIGHT}px`;
		simulationScreen.style.position = "relative";

		for (let floor = numFloors; floor >= 1; floor--) {
			const floorDiv = document.createElement("div");
			floorDiv.classList.add("floor");
			floorDiv.style.position = "absolute";
			floorDiv.style.bottom = `${(floor - 1) * FLOOR_HEIGHT}px`;
			floorDiv.style.width = "120px";
			floorDiv.innerHTML = `
                <span>Floor ${floor}</span>
                <div class="button-group">
                    ${
											floor !== numFloors
												? `<button class="up-button" data-floor="${floor}">Up</button>`
												: ""
										}
                    ${
											floor !== 1
												? `<button class="down-button" data-floor="${floor}">Down</button>`
												: ""
										}
                </div>
            `;
			simulationScreen.appendChild(floorDiv);
		}

		const liftWidth = window.innerWidth > 768 ? 40 : 30;
		for (let i = 0; i < numLifts; i++) {
			const lift = document.createElement("div");
			lift.classList.add("lift");
			lift.style.position = "absolute";
			lift.style.bottom = "0";
			lift.style.left = `${(i + 1) * (liftWidth + 20) + 120}px`;
			lift.style.transition = `bottom ${MOVE_TIME_PER_FLOOR}s`;
			lift.innerHTML = `
                <div class="lift-door left-door"></div>
                <div class="lift-door right-door"></div>
            `;
			simulationScreen.appendChild(lift);
			lifts.push({
				element: lift,
				currentFloor: 1,
				targetFloor: 1,
				isMoving: false,
			});
		}

		simulationScreen.addEventListener("click", (e) => {
			if (
				e.target.classList.contains("up-button") ||
				e.target.classList.contains("down-button")
			) {
				const floor = parseInt(e.target.dataset.floor);
				const direction = e.target.classList.contains("up-button")
					? "up"
					: "down";
				callLift(floor, direction, e.target);
			}
		});

		window.addEventListener("resize", () => {
			updateFloorHeight();
			updateLiftPositions();
		});
	}

	function updateFloorHeight() {
		FLOOR_HEIGHT = window.innerWidth > 768 ? 80 : 60;
		const floors = document.querySelectorAll(".floor");
		floors.forEach((floor, index) => {
			floor.style.bottom = `${index * FLOOR_HEIGHT}px`;
		});
		simulationScreen.style.height = `${numFloors * FLOOR_HEIGHT}px`;
	}

	function updateLiftPositions() {
		const liftWidth = window.innerWidth > 768 ? 40 : 30;
		lifts.forEach((lift, index) => {
			lift.element.style.left = `${(index + 1) * (liftWidth + 20) + 120}px`;
			lift.element.style.bottom = `${(lift.currentFloor - 1) * FLOOR_HEIGHT}px`;
		});
	}

	function callLift(targetFloor, direction, button) {
		button.disabled = true; // Disable the button
		const availableLift = findBestLift(targetFloor);
		if (availableLift) {
			moveLift(availableLift, targetFloor, direction, button);
		} else {
			console.log("All lifts are busy. Adding to queue.");
			liftRequests.push({
				floor: targetFloor,
				direction: direction,
				button: button,
			});
		}
	}

	function findBestLift(targetFloor) {
		let bestLift = null;
		let shortestDistance = Infinity;

		for (let lift of lifts) {
			if (!lift.isMoving) {
				const distance = Math.abs(lift.currentFloor - targetFloor);
				if (distance < shortestDistance) {
					shortestDistance = distance;
					bestLift = lift;
				}
			}
		}

		return bestLift;
	}

	function moveLift(lift, targetFloor, direction, button) {
		lift.isMoving = true;
		lift.targetFloor = targetFloor;
		const targetPosition = (targetFloor - 1) * FLOOR_HEIGHT;
		const floorsToMove = Math.abs(lift.currentFloor - targetFloor);
		const moveTime = floorsToMove * MOVE_TIME_PER_FLOOR;

		// Close doors
		toggleLiftDoors(lift, "close");

		setTimeout(() => {
			lift.element.style.transition = `bottom ${moveTime}s`;
			lift.element.style.bottom = `${targetPosition}px`;

			setTimeout(() => {
				lift.currentFloor = targetFloor;
				lift.isMoving = false;
				console.log(`Lift arrived at floor ${targetFloor}`);

				// Open doors
				toggleLiftDoors(lift, "open");

				setTimeout(() => {
					button.disabled = false; // Re-enable the button
					checkAndMoveToNextFloor(lift);
				}, DOOR_ANIMATION_TIME * 1000);
			}, moveTime * 1000);
		}, DOOR_ANIMATION_TIME * 1000);
	}

	function toggleLiftDoors(lift, action) {
		const leftDoor = lift.element.querySelector(".left-door");
		const rightDoor = lift.element.querySelector(".right-door");

		if (action === "open") {
			leftDoor.style.transform = "translateX(-100%)";
			rightDoor.style.transform = "translateX(100%)";
		} else if (action === "close") {
			leftDoor.style.transform = "translateX(0)";
			rightDoor.style.transform = "translateX(0)";
		}
	}

	function checkAndMoveToNextFloor(lift) {
		if (liftRequests.length > 0) {
			const nextRequest = liftRequests.shift();
			moveLift(
				lift,
				nextRequest.floor,
				nextRequest.direction,
				nextRequest.button
			);
		}
	}
});
