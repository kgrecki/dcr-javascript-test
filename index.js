"use strict";

let form = document.querySelector("form");
let countryData;

// load data and default selection on ready
document.addEventListener("DOMContentLoaded", function (event) {
    fetch("data/countries.json")
        .then(response => response.json())
        .then(data => {
            countryData = data;
            form.dispatchEvent(new Event("change"));
        }).catch(error => console.error("Error fetching JSON:", error));
});


form.addEventListener("change", (event) => {
    let data = [];
    let regions = {};
    // format data based on selection
    switch (event.target.value) {
        case "c_border":
            for (let [key, obj] of Object.entries(countryData)) {
                data.push([obj.name, obj.alpha3Code, obj.borders.length, obj]);
            }
            break;
        case "c_timezones":
            for (let [key, obj] of Object.entries(countryData)) {
                data.push([obj.name, obj.alpha3Code, obj.timezones.length, obj]);
            }
            break;
        case "c_languages":
            for (let [key, obj] of Object.entries(countryData)) {
                data.push([obj.name, obj.alpha3Code, obj.languages.length, obj]);
            }
            break;
        case "r_countries":
            for (let [key, obj] of Object.entries(countryData)) {
                if (!regions[obj.region]) {
                    regions[obj.region] = 1;
                } else {
                    regions[obj.region]++;
                }
            }
            for (let [key, reg] of Object.entries(regions)) {
                data.push([key, key.toUpperCase(), reg]);
            }
            break;
        case "r_timezones":
            for (let [key, obj] of Object.entries(countryData)) {
                if (!regions[obj.region]) {
                    regions[obj.region] = obj.timezones;
                } else {
                    regions[obj.region] = regions[obj.region].concat(obj.timezones);
                }
            }
            for (let [key, zones] of Object.entries(regions)) {
                let uniqueZones = new Set(zones);
                data.push([key, key.toUpperCase(), uniqueZones.size]);
            }
            break;
        default:
            // c_population
            for (let [key, obj] of Object.entries(countryData)) {
                data.push([obj.name, obj.alpha3Code, obj.population, obj])
            }
    }

    updateTable(data);
    // limit data points on the chart so it looks decent
    updateChart(data.slice(0, 25));
});


const width = 1200;
const height = 800;
const padding = 5;


function updateChart(data) {
    d3.selectAll(".bubble").remove()

    const pack = d3.pack()
        .size([width - padding, height - padding])
        .padding(2);

    const hierarchy = d3.hierarchy({ children: data })
        .sum(d => d[2]);

    const root = pack(hierarchy);

    const svg = d3.select("#chart")
        .attr("width", width)
        .attr("height", height);

    const bubbles = svg.selectAll(".bubble")
        .data(root.descendants().slice(1))
        .enter()
        .append("g")
        .attr("class", "bubble")
        .attr("transform", d => `translate(${d.x + padding}, ${d.y + padding})`);

    bubbles.append("circle")
        .attr("r", d => d.r)
        .attr("fill", "black");

    bubbles.append("text")
        .attr("dy", "-0.4em")
        .style("text-anchor", "middle")
        .append("tspan")
        .text(d => d.data[1])
        .append("tspan")
        .attr("x", 0)
        .attr("dy", "1.2em")
        .text(d => d.data[2]);

    d3.selectAll("text").style("fill", "white");

    if (data[0][3]) {
        // add tooltips if extra country data was provided
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        svg.selectAll(".bubble")
            .on("mouseover", (event, d) => {
                tooltip.transition().style("opacity", 1);
                tooltip.html(`Country: ${d.data[0]}<br>Capital: ${d.data[3]["capital"]}<br>Region: ${d.data[3]["region"]}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition().style("opacity", 0);
            });
    }
}


function updateTable(data) {
    data.sort((a, b) => (a[2] > b[2] ? -1 : 1));
    let table = document.querySelector("table");
    table.innerHTML = "";

    for (let dt of data) {
        let row = table.insertRow();
        for (const val of dt) {
            if (typeof val === "object") {
                // ignore extra data (tooltips) in table output
                continue;
            }
            let cell = row.insertCell();
            let text = document.createTextNode(val);
            cell.appendChild(text);
        }
    }
}

