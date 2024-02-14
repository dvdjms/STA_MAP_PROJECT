// to run: npx http-server -p 8000

import {STA_Jira_API_key, David_jira_api_key, apiKeyMap, David_email, Michael_email} from "/config.js";

// Create the script tag, set the appropriate attributes
var script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKeyMap}&callback=initMap`;
script.async = true;


// Attach your callback function to the `window` object
window.initMap = function() {
  // JS API is loaded and available
};

// Append the 'script' element to 'head'
document.head.appendChild(script);
const projectDataFromJira = [];


const david_email = David_email;
const david_api_key = David_jira_api_key;
const michael_email = Michael_email;
const STA_API_key = STA_Jira_API_key;

const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

const allIssues = 'https://sta2020.atlassian.net/rest/api/3/issues';
const allProjects = 'https://sta2020.atlassian.net/rest/api/3/search?jql=project=10002&startAt=0&maxResults=1000&active=false';
const filteredProjects = 'https://sta2020.atlassian.net/rest/api/3/search?jql=project=10002&startAt=600&maxResults=1000&fields=summary,customfield_10099,customfield_10148,customfield_10027,customfield_10214,timespent,status';



async function fetchData() {
    try {
        const response = await fetch(proxyUrl + filteredProjects, {
            method: 'GET',
            headers: {
                // 'Authorization': 'Basic ' + btoa(michael_email + ':' + STA_API_key),
                'Authorization': 'Basic ' + btoa(david_email + ':' + david_api_key),
                'Accept': 'application/json',
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        console.log('Response data', data)

        for (let i = 0; i < data.issues.length; i++){
            const postcode = data.issues[i].fields && data.issues[i].fields["customfield_10099"];
            const summary = data.issues[i].fields && data.issues[i].fields["summary"];
            const sector = data.issues[i].fields && data.issues[i].fields["customfield_10148"];
            const published = data.issues[i].fields && data.issues[i].fields["customfield_10214"];
            const timespent = data.issues[i].fields && data.issues[i].fields.timespent;
            const time = ConvertSeconds(timespent);

            if(postcode !== null && postcode !== undefined && published !== null){
                const projectInformation = {
                    postcode: postcode,
                    summary: summary,
                    sector: sector,
                    time: time,
                };
                projectDataFromJira.push(projectInformation);
            };
        };
        initMap();
        
    } catch (error) {
        console.error('Error: failed to fetch', error);
        throw error;
    }
}


const initMap = () => {
    var map = new google.maps.Map(document.getElementById("map"), {
        mapId: 'ccfcd840ddff774a',
        // mapId: "b1c51018eb44d70b",
        center: { lat: 56.965081, lng: -3.916480 },
        zoom: 6.8,
        minZoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
        // fullscreenControl: false,
    });

    var infoWindow = new google.maps.InfoWindow();  // Create a new InfoWindow

    let legend = document.getElementById('legend');
    legend.innerHTML = ''; // Clear the legend element

    if (Array.isArray(projectDataFromJira)) {

        projectDataFromJira.forEach((location) => {
            async function getCoordinates() {
                try {
                    const coordinates = await Postcode(location.postcode.trim())
                    if (coordinates && coordinates.status === 200) {
                        var marker = new google.maps.Marker({
                        position: { lat: parseFloat(coordinates.result.latitude), lng: parseFloat(coordinates.result.longitude)},
                        map,
                        animation: google.maps.Animation.DROP,
                    });

                    // Add click event listener to the marker
                    marker.addListener('click', function() {
                        // Set content for the InfoWindow
                        var contentString = `<div className = "popuptext">
                            <p id="summary">${location.summary}</p>
                            <p>${location.sector.value}</p>
                            <p>${location.time}</p>
                            <a href=${location.postcode} target=”_blank”>${location.postcode}</a>
                            </div>`;
                        
                        // Set the content and open the InfoWindow
                        infoWindow.setContent(contentString);
                        infoWindow.open(map, marker);
                    });
                }
                } catch (error) {
                    console.error('Error:', error)
                }
            }
            getCoordinates();
            
        });

        var imageBounds = {
            north: 58.98182,
            south: 57.181400,
            east:  2.902282,
            west: -0.502282,
        };

        var img = new Image();
        img.src = './stapic.png';
        var staOverlay = new google.maps.GroundOverlay(img.src, imageBounds);
        staOverlay.setMap(map);

        const icons = {
            HEALTH: {
                name: 'HEALTH AND SOCIAL CARE',
                icon: 'MarkerPink.png'
            },
            LOCAL: {
                name: 'LOCAL BUSINESS RECOVERY',
                icon: 'MarkerGreen.png'
            },
            TRAVEL: {
                name: 'TRAVEL AND TOURISM',
                icon: 'MarkerBlue.png'
            },
            REMOTE: {
                name: 'REMOTE SUPPORT',
                icon: 'MarkerRed.png'
            },
            EDUCATION: {
                name: 'EDUCATION AND TRAINING',
                icon: 'MarkerPurple.png'
            }
        };

        for (let key in icons) {
            let type = icons[key];
            let name = type.name;
            let icon = type.icon;
            let div = document.createElement('div');
            div.innerHTML = `<img style="width: 18px; float:left;" src="${icon}">&nbsp;&nbsp; ${name}<br><br>`
            legend.appendChild(div);
        }
        map.controls[google.maps.ControlPosition.LEFT_TOP].push(legend);
   
    };
};

// Use window.onload to ensure that the Google Maps API has loaded before initializing the map
function initializeMap() {
    fetchData().then(initMap);
}
window.onload = initializeMap;


async function Postcode(postcode) {
    try {
        const response = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting postcode coordinates:', error);
        throw error;
    };
};


function ConvertSeconds(n) { 
    var day = parseInt( n / (24 * 3600)); 
    n = n % (24 * 3600); 
    var hour = parseInt(n / 3600); 
    n %= 3600; 
    var minutes = n / 60; 
    return `${day}d ${hour}h ${minutes}m`;
};
