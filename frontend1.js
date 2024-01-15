
let regions = [];
let listOfStops = [];

const regList = document.querySelector('#regionsList');
const stopList = document.querySelector('#stopsList');
const input = document.querySelector('#search-bar1');
const input2 = document.querySelector('#search-bar2');
const left_container = document.querySelector("#left");

const main = document.getElementById("main");
const placeForButtons = document.getElementById("forButtons");

//all regions, stops into a list
async function mergeIntoList(){
    const response = await fetch('http://localhost:8080/regions')
    const data = await response.json();

    for (region of data){
        var item = region.stop_area;
        
        if(item != ""){
            regions.push(item);
        }
    }

    regions.sort();
    createUL(regions, regList);
}

mergeIntoList();

//from list to ul
function createUL(data, element){
    if(data){
        element.innerHTML = "";
        let innerElement = "";
        data.forEach((item) => {
            innerElement += '<li>'+item+'</li>';
        });

        element.innerHTML = innerElement;
    }
}

//autocompletion, clicks
function filter(data, searchString){
    return data.filter((x) => x.toLowerCase().includes(searchString.toLowerCase()));
}

function addEventListeners(){
    input.addEventListener("input", function() {
        const filteredData = filter(regions, input.value);
        createUL(filteredData, regList)
    })

    input.addEventListener("input", function() {
        var firstInputValue = document.getElementById("search-bar1").value;

        if (firstInputValue == "") {
        document.getElementById("search-bar2").value = "";
        }
    })

    input.addEventListener("click", function() {
        const filteredData = filter(regions, input.value);
        createUL(filteredData, regList)
    })

    input2.addEventListener("input", function() {
        const filteredData = filter(listOfStops, input2.value);
        createUL(filteredData, stopList)
    })

    input2.addEventListener("click", function() {
        const filteredData = filter(listOfStops, input2.value);
        createUL(filteredData, stopList)
    })

    document.getElementById('regionsList').addEventListener('click', function(event) {
        if (event.target.tagName === 'LI') {
            document.getElementById('search-bar1').value = event.target.textContent;
        }
    });

    document.getElementById('stopsList').addEventListener('click', function(event) {
        if (event.target.tagName === 'LI') {
            document.getElementById('search-bar2').value = event.target.textContent;
        }
    });
}

addEventListeners();

//bus stops for regions
async function regionStops(){
    listOfStops = [];
    var input = document.getElementById("search-bar1").value;
    const response = await fetch('http://localhost:8080/regionStops');
    const data = await response.json();

    for (item of data){
        const pattern = item.stop_area;

        if (input == pattern){
            listOfStops.push(item.stop_name)
        }
    }

    listOfStops.sort();
    createUL(listOfStops, stopList);
}

regionStops()


//shows bus stops
async function showBus(){
    let busNums = [];

    const container = document.getElementById("left");
    const label = document.createElement('p');
    
    container.innerHTML = "";
    label.innerHTML = "";
    placeForButtons.innerHTML = "";

    const response = await fetch('http://localhost:8080/stop/' + input2.value + "/" + input.value);
    const data = await response.json();

    for (item of data){
        if (!(busNums.includes(item.route_short_name))) {
            busNums.push(item.route_short_name);    
        }
    }

    busNums.sort();

    if (busNums.length != 0){

        label.textContent = "The stops of station " + input2.value;
        label.style.textAlign = "center";
        label.style.fontSize = "large";
        label.style.marginTop = "10px"
        container.appendChild(label);

        for(let i = 0; i < busNums.length; i++){
            const root = document.createElement('button');
            
            root.classList = "btn btn-dark m-1 w-100 btn-lg btn-block";
            root.textContent = busNums[i];
            root.onclick = () => buttonClick(busNums[i], input2.value);            
            placeForButtons.append(root);

            container.appendChild(placeForButtons);
        }
    } 
    
    else {
        const root = document.createElement('div');
        root.classList = "container rounded-3 p-5 my-5 bg-dark text-white";
        root.textContent = "Information about this bus is unavailable right now. We apologize!"
        root.style.textAlign = "center";
        root.style.fontSize = "x-large";

        main.append(root)
    }
}

//clear all inputs
function resetAll(){
    var input1 = document.getElementById("search-bar1");
    var input2 = document.getElementById("search-bar2");
    
    input1.value = "";
    input2.value = "";
}

//location
async function getLocation(){
    //user ip search
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();

    //find the nearest bus stop
    const userLat = data.latitude;
    const userLong = data.longitude;
    const city = data.city;


    const query = await fetch("http://localhost:8080/stopNear/" + city);
    const info = await query.json();

    const first = info[0];

    let region = first.stop_area;
    let stop = first.stop_name;
    let distance = calculateDistance(userLat, userLong, first.stop_lat, first.stop_lon);

    //evaluation of the nearest bus stop and region
    info.forEach(element => {
        let equals = calculateDistance(userLat, userLong, element.stop_lat, element.stop_lon);

        if (equals < distance){
            distance = equals;
            finLat = element.stop_lat;
            finLong = element.stop_lon;
            region = element.stop_area;
            stop = element.stop_name;
        } else{null}
    });

    input.value = region;
    input.click();
    input2.value = stop;
    input2.click();

    //design stuff + put to main web
    const box = document.createElement("div");
    box.classList = "container rounded-5";
    box.style.backgroundColor = "white";
    box.style.width = "75%";
    box.style.color = "black";
    box.style.display = "flex";

    const image = document.createElement("img");
    image.src = "./earth.png";

    const container = document.getElementById("location");
    const string = document.createElement("p");
    let readyLocation = data.country_name + ", " + region + ".";
    
    string.textContent = readyLocation;
    string.style.textAlign = "center";
    string.style.margin = "10px";
    string.style.marginLeft = "20px";

    input.textContent = data.city;

    box.appendChild(image);
    box.append(string);
    container.appendChild(box);
}

getLocation();

//distance calculation
function calculateDistance(x1, y1, x2, y2) {
    var distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance;
}

//when press the bus stop button
async function buttonClick(num, busStop){
    let times = [];
    const currentTime = getTime();

    const response = await fetch("http://localhost:8080/time/"+num+"/"+busStop);
    console.log(response);
    const data = await response.json();

    data.forEach(element => {
        if(element.arrival_time > currentTime){
            times.push(element.arrival_time)
        }
    });

    times.sort();
    console.log(times);
    timeButtonContainer(times.slice(0, 5));
}

//current time
function getTime(){
    const time = new Date();
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    let result = hours + ":" + minutes + ":" + seconds;
    

    return result;
}

//place for time of the bus
function timeButtonContainer(array){
    const right_container = document.getElementById("right");

    const label = document.createElement('p');

    label.innerHTML = "";
    right_container.innerHTML = "";

    label.textContent = "Bus times of choosen station";
    label.style.textAlign = "center";
    label.style.fontSize = "large";
    label.style.marginTop = "10px"
    right_container.appendChild(label);

    const container = document.createElement("div");
    container.classList = "container rounded-5 p-3 my-3 bg-secondary text-white";

    array.forEach(element => {
        const forTime = document.createElement("div");
        forTime.classList = "container rounded-5 p-2 my-2 bg-info text-white";
        forTime.textContent = element;
        forTime.style.textAlign = "center";
        container.appendChild(forTime);
    });

    right_container.appendChild(container);
}