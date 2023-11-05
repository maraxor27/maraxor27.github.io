const NO_SELECTED_EXERCISE = "undefined";
const EXERCISES_STORAGE_KEY = "exercises";
const WORKOUTS_STORAGE_KEY = "workouts";

const sessionExerciseTable = document.getElementById("SessionExerciseTable");
const previousWorkoutList = document.getElementById("PreviousWorkoutList");
const mainExerciseSelector = document.getElementById("MainExerciseSelector");
const addExerciseToTrainingButton = document.getElementById("AddExerciseToTrainingButton");
const addNamedExerciseButton = document.getElementById("AddNamedExerciseButton");
const finishWorkoutButton = document.getElementById("FinishWorkoutButton");
const newNamedExerciseInput = document.getElementById("NewNamedExerciseInput")


var exercises = new Map();
var workouts = new Map();

function loadFromStorage(key) {
	value = localStorage[key];
	if (value != undefined)
		return JSON.parse(value);
	return undefined;
}

function storeIntoStorage(key, obj) {
	localStorage.setItem(key, JSON.stringify(obj))
}

function addNamedExercise(name) {
	element = document.createElement('option');
	element.value = name;
	element.innerHTML = name;
	mainExerciseSelector.appendChild(element);
	exercises.set(name, element);
}

function storeWorkouts() {
	var store = []
	workouts.forEach((value, key, map) => {
		store.push(value.workout);
	})
	storeIntoStorage(WORKOUTS_STORAGE_KEY, store)
}

function removeNamedExercise(name) {
	element = exercises.get(name);
	if (element == undefined) {
		return false;
	}
	exercises.delete(name);
	mainExerciseSelector.removeChild(element);
	return true;
}

function syncNamedExercises() {
	var store = [];
	exercises.forEach((value, key, map) => {
		store.push(key);
	})
	storeIntoStorage(EXERCISES_STORAGE_KEY, store)
}

function createExerciseTableRow(name, default_values={}) {
	let row = document.createElement("tr");
	row.innerHTML = `
	<td>${name}</td>
	<td><input value="${default_values.weigth == undefined ? "" : default_values.weigth}"></input></td>
	<td><input value="${default_values.reps == undefined ? "" : default_values.reps}"></input></td>
	<td><input value="${default_values.break == undefined ? "" : default_values.break}"></input></td>
	<td><input value="${default_values.comments == undefined ? "" : default_values.comments}"></input></td>
	`
	removeColumn = document.createElement("td");
	removeButton = document.createElement("button")
	removeButton.classList.add("red")
	removeButton.innerHTML = "Delete"
	removeButton.addEventListener("click", (event) => {
		sessionExerciseTable.removeChild(row);
	}) 
	removeColumn.appendChild(removeButton);
	row.appendChild(removeColumn);
	return row;
}

function extractDataFromTableRow(row) {
	var exercise = {};
	var childs = row.children;
	exercise.name = childs[0].innerText;
	exercise.weigth = childs[1].children[0].value;
	exercise.reps = childs[2].children[0].value;
	exercise.break = childs[3].children[0].value;
	exercise.comments = childs[4].children[0].value;
	return exercise;
}

function createWorkout(workout) {
	let workout_date = workout.date
	let element = document.createElement("div");
	element.innerHTML = `<p>${JSON.stringify(workout)}</p>`;
	var button = document.createElement("button")
	button.classList.add("red")
	button.innerText = "Delete"
	button.addEventListener("click", () => {
		previousWorkoutList.removeChild(element);
		workouts.delete(workout_date);
		storeWorkouts();
	})
	element.appendChild(button);
	return element;
}

function addWorkout(workout) {
	var element = createWorkout(workout);
	workouts.set(workout.date, {"workout": workout, "element": element});
	previousWorkoutList.appendChild(element);
}

function loadExerciseFromLastWorkout(workout_map) {
	var key_iter = workout_map.keys();
	var most_recent = undefined;
	for (var key of key_iter) {
		if (most_recent == undefined || most_recent < key) {
			most_recent = key;
		}
	}
	var workout = workout_map.get(most_recent);
	var exercises = workout.workout.exercises;
	for (const exercise of exercises) {
		element = createExerciseTableRow(exercise.name, exercise);
		sessionExerciseTable.appendChild(element);
	}
}

if (typeof(Storage) === "undefined") {
	alert("Storage is not supported. Your training can't be stored in your browser");
} else {
	{
		var list = loadFromStorage(EXERCISES_STORAGE_KEY);
		if (list != undefined) {
			list.forEach(addNamedExercise);
		} else {
			list = [];
		}
	}
	{
		var list = loadFromStorage(WORKOUTS_STORAGE_KEY);
		if (list == undefined) {
			list = [];
		}
		for (entry of list) {
			entry.date = new Date(entry.date);
		}
		if (list != undefined) {
			list.forEach(addWorkout);
		}
		if (list.length > 0)
			loadExerciseFromLastWorkout(workouts);
	}
}

addExerciseToTrainingButton.addEventListener("click", () => {
	exercise = mainExerciseSelector.value
	if (exercise == NO_SELECTED_EXERCISE) {
		return false;
	}
	element = createExerciseTableRow(exercise);
	mainExerciseSelector.value = NO_SELECTED_EXERCISE;
	sessionExerciseTable.appendChild(element);
});

addNamedExerciseButton.addEventListener("click", () => {
	var name = newNamedExerciseInput.value;
	if (name.length < 1) {
		return;
	} 
	newNamedExerciseInput.value = "";
	addNamedExercise(name);
});

finishWorkoutButton.addEventListener("click", () => {
	var workout = {"date": new Date(), exercises: new Array()};
	var rows = sessionExerciseTable.children
	if (rows.length <= 1) {
		return;
	}
	for (let i = 1; i < rows.length; i++) {
		var exercise = extractDataFromTableRow(rows[i]);
		workout.exercises.push(exercise);
	}

	addWorkout(workout)
	storeWorkouts();
});

