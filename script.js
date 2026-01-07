const sidebar = document.querySelector('.country-sidebar');
const countryObject = document.querySelector('object');
const mapContainer = document.querySelector('.map-container');

const countryNameText = document.querySelector('.country-name');
const flagImg = document.querySelector('.country-flag');
const capitalText = document.querySelector('.capital');
const populationText = document.querySelector('.population');
const currencyText = document.querySelector('.currency');
const regionText = document.querySelector('.region');
const areaText = document.querySelector(".area")
const closeBtn = document.querySelector('.close-sidebar');
const footer = document.querySelector('.footer');
const countryInput = document.querySelector('.input-country');
const errorMsg = document.querySelector('.error');
const searchBtn = document.querySelector('.search-btn');
let favBtn = document.querySelector('.fav-button');
let favList = document.querySelector(".favList")
let header = document.querySelector(".header")


let allCountries = [];
let favorites = [];
let selectedCountry = null;

// 2. Ölkə siyahısını (kodları tapmaq üçün) yükləyirik
fetch("https://raw.githubusercontent.com/mledoze/countries/master/countries.json")
    .then(res => res.json())
    .then(data => {
        allCountries = data;
        console.log(allCountries)
    });

countryObject.addEventListener("load", () => {
    let svgDoc = countryObject.contentDocument;
    let paths = svgDoc.querySelectorAll('path');

    paths.forEach(path => {
        path.addEventListener("click", () => {
            let countryId = path.getAttribute('class') || path.getAttribute('name') || path.id;
            let clickedCountry = countryId.toLowerCase().trim()

            console.log("Seçilən Ölkə:" + clickedCountry)

            let found = allCountries.find(country => {
                let commonName = country.name.common.toLowerCase();
                let official = country.name.official.toLowerCase();
                let c2 = country.cca2.toLowerCase(); // Məsələn: "us"
                let c3 = country.cca3.toLowerCase(); // Məsələn: "usa"

                if (clickedCountry === "united states" || clickedCountry === "us" || clickedCountry === "usa") {
                    return c2 === "us";
                }
                if (clickedCountry === "turkey" && (commonName === "türkiye" || commonName === "turkey")) {
                    return true;
                }
                if (commonName === clickedCountry || official === clickedCountry || c2 === clickedCountry || c3 === clickedCountry) {
                    return true;
                }
                if (commonName.length < 25) {
                    return official.includes(clickedCountry) || commonName.includes(clickedCountry) ||
                        clickedCountry.includes(commonName);
                }

                return false;
            });

            if (found != null) {
                //2ci api Bayraq məlumatları
                fetch(`https://restcountries.com/v3.1/alpha/${found.cca2}`)
                    .then(res => res.json())
                    .then(apiData => {
                        let country = apiData[0];
                        selectedCountry = country;

                        updateIcon(country)

                        countryNameText.textContent = country.name.common;
                        capitalText.textContent = country.capital ? country.capital[0] : "N/A";
                        regionText.textContent = country.region;
                        areaText.textContent = country.area ? country.area.toLocaleString() + " km²" : "N/A";
                        populationText.textContent = country.population ? country.population.toLocaleString() : "N/A";

                        // Valyuta
                        if (country.currencies) {
                            let curKey = Object.keys(country.currencies)[0];

                            let curName = country.currencies[curKey].name
                            let curSymbol = country.currencies[curKey].symbol
                            currencyText.textContent = `${curName} (${curSymbol})`;

                        }

                        // Bayraq
                        flagImg.src = country.flags.png;
                        flagImg.style.display = "block";

                        let weatherBox = document.querySelector('.weather-box');
                        if (weatherBox === null) {
                            let weatherBox = document.querySelector('.weather-box');
                            weatherBox.className = 'weather-box';
                            sidebar.append(weatherBox);
                        }

                        if (country.capitalInfo && country.capitalInfo.latlng) {
                            let enlik = country.capitalInfo.latlng[0];
                            let uzunluq = country.capitalInfo.latlng[1];

                            weatherBox.textContent = "☁️ Hava məlumatı yüklənir, zəhmət olmasa gözləyin...";

                            //3-cü api hava məlumatları

                            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${enlik}&longitude=${uzunluq}&current_weather=true`)
                                .then(res => res.json())
                                .then(data => {
                                    const degree = data.current_weather.temperature;
                                    const kod = data.current_weather.weathercode;
                                    let forecastText = "";
                                    let emoji = "";

                                    if (kod === 0) {
                                        emoji = "☀️";
                                        forecastText = "Açıq səma";
                                    } else if (kod >= 1 && kod <= 3) {
                                        emoji = "🌤️";
                                        forecastText = "Az buludlu";
                                    } else if (kod >= 45 && kod <= 48) {
                                        emoji = "🌫️";
                                        forecastText = "Dumanlı";
                                    } else if (kod >= 51 && kod <= 67) {
                                        emoji = "🌧️";
                                        forecastText = "Yağışlı";
                                    } else if (kod >= 71 && kod <= 77) {
                                        emoji = "❄️";
                                        forecastText = "Qarlı";
                                    } else if (kod >= 95) {
                                        emoji = "⚡";
                                        forecastText = "Fırtınalı";
                                    } else {
                                        emoji = "☁️";
                                        forecastText = "Buludlu";
                                    }

                                    weatherBox.textContent = `🌡️ Paytaxtda temperatur: ${degree}°C | ${emoji} ${forecastText}`;
                                })
                                .catch(() => {
                                    weatherBox.textContent = "⚠️ Üzr istəyirik, hava məlumatını ala bilmədik.";
                                });
                        } else {
                            weatherBox.textContent = "📍 Bu ölkə üçün paytaxt koordinatları tapılmadı.";
                        }
                        sidebar.classList.add('active');
                        mapContainer.classList.add('map-shifted');
                        footer.classList.add('map-shifted')
                        header.classList.add("map-shifted")

                    });

            } else {
                console.warn("Heç bir ehtimalla tapılmadı: " + clickedCountry);
            }

        });
    });
});

closeBtn.addEventListener("click", () => {
    sidebar.classList.remove('active');
    mapContainer.classList.remove('map-shifted');
    footer.classList.remove('map-shifted');
    header.classList.remove("map-shifted")
    countryInput.value = ""
});

// Axtarış funksiyası



function showSidebar(country) {
    //favorite bolmesi ucun
    selectedCountry = country
    updateIcon(country)

    let icon = favBtn.querySelector("i");
    let check = favorites.some((item) => item.name.common === country.name.common)

    if (check) {
        icon.className = "bi bi-heart-fill";
    } else {
        icon.className = "bi bi-heart";
    }


    countryNameText.textContent = country.name.common;
    capitalText.textContent = country.capital?.[0] ?? "N/A";
    regionText.textContent = country.region;
    areaText.textContent = country.area ? `${country.area.toLocaleString()} km²` : "N/A";
    populationText.textContent = country.population ? country.population.toLocaleString() : "N/A";

    // 2. Valyuta hissəsi 
    //object.keys-melumatin ne olduquna baxmr gedb 0-ci indexdeki melumati getirir
    if (country.currencies) {
        const curKey = Object.keys(country.currencies)[0];
        const currency = country.currencies[curKey];
        const curName = currency.name;
        const curSymbol = currency.symbol;

        currencyText.textContent = `${curName} (${curSymbol})`;
    }

    // 3. Bayraq
    flagImg.src = country.flags.png;
    flagImg.style.display = "block";

    // 4. Hava durumu  
    let weatherBox = document.querySelector('.weather-box');
    if (!weatherBox) {
        weatherBox = document.createElement('div');
        weatherBox.className = 'weather-box';
        sidebar.append(weatherBox);
    }

    if (country.capitalInfo?.latlng) {
        let lat = country.capitalInfo.latlng[0]; // Birinci element (Enlik)
        let lng = country.capitalInfo.latlng[1]; // İkinci element (Uzunluq)       
        weatherBox.textContent = "☁️ Hava məlumatı yüklənir...";

        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
            .then(res => res.json())
            .then(data => {
                let degree = data.current_weather.temperature;
                weatherBox.textContent = `🌡️ Paytaxtda temperatur: ${degree}°C`;
            })
            .catch(() => weatherBox.textContent = "⚠️ Hava məlumatı alınmadı.");
    }

    // 6. Sidebarı açırıq
    sidebar.classList.add('active');
    mapContainer.classList.add('map-shifted');
    footer.classList.add('map-shifted');
    header.classList.add("map-shifted");




};


function searchCountry() {
    let inputText = countryInput.value.trim();

    if (inputText === "") {
        errorMsg.textContent = "";
        sidebar.classList.remove('active');
        mapContainer.classList.remove('map-shifted');
        footer.classList.remove("map-shifted")
        header.classList.remove("map-shifted")
        return;
    }

    // Ən az 3 hərf olanda API-ya müraciət edirik
    if (inputText.length >= 3) {
        fetch(`https://restcountries.com/v3.1/name/${inputText}`)
            .then(res => {
                if (res.ok) {
                    return res.json();
                }
                return null;
            })
            .then(data => {
                errorMsg.textContent = "";
                showSidebar(data[0]);
            })
            .catch(() => {
                errorMsg.textContent = "Belə bir ölkə yoxdur!";
                sidebar.classList.remove('active');
                mapContainer.classList.remove('map-shifted');
                footer.classList.remove('map-shifted')
                header.classList.remove('map-shifted')
            });
    }
}

countryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchCountry();
    }
});
searchBtn.addEventListener('click', searchCountry);







// favorit sidebar



let openFavSidebar = document.querySelector(".openFavSidebar");
let closeFavBtn = document.querySelector(".closeFavBtn");
let favSidebar = document.querySelector(".fav-sidebar");
let mainPage = document.querySelector(".mainPage")

openFavSidebar.addEventListener("click", (e) => {
    e.preventDefault();



    favSidebar.classList.add("active");
    mainPage.classList.remove("active")

});

closeFavBtn.addEventListener("click", () => {
    favSidebar.classList.remove("active");
});



document.addEventListener("click", (e) => {
    if (favSidebar.contains(e.target)) return;

    if (openFavSidebar.contains(e.target)) return;

    favSidebar.classList.remove("active");
    mainPage.classList.add("active")
});


countryObject.addEventListener("load", () => {
    const svgDoc = countryObject.contentDocument;

    svgDoc.addEventListener("click", () => {
        favSidebar.classList.remove("active");
    });
});




function addfavorite() {
    favList.innerHTML = ""
    if (favorites.length === 0) {
        const emptyMsg = document.createElement("p");
        emptyMsg.className = "empty-msg";
        emptyMsg.textContent = "Hələ ki, favorit yoxdur.";
        favList.append(emptyMsg);
        return;
    }
    favorites.forEach((favCountry) => {
        let favItem = document.createElement("div")
        favItem.className = "favItem"

        let favFlag = document.createElement("img")
        favFlag.src = favCountry.flags.png
        favFlag.className = "favFlag"

        const favName = document.createElement("span")
        favName.className = "favName"
        favName.textContent = favCountry.name.common

        const deleteBtn = document.createElement("i")
        deleteBtn.className = "bi bi-trash text-danger"
        deleteBtn.style.cursor = "pointer"

        //deletebtndan basqa hara click edecekse olke sidebari acilir
        favItem.addEventListener("click", (e) => {
            if (e.target !== deleteBtn) {
                showSidebar(favCountry);
            }
        });
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation()
            favorites = favorites.filter(c => c.name.common !== favCountry.name.common);

            // Əgər sildiyimiz ölkə hal-hazırda ekrandadırsa, ürəyi boşalt
            if (selectedCountry && selectedCountry.name.common === favCountry.name.common) {
                let favIcon = favBtn.querySelector("i");
                favIcon.className = "bi bi-heart";
            }
            addfavorite()
        })


        favItem.append(favFlag, favName, deleteBtn);
        favList.append(favItem);
    })
}





favBtn.addEventListener("click", () => {

    if (!selectedCountry) {
        return;
    }

    let fav = favorites.some((item) => item.name.common === selectedCountry.name.common)
    if (fav === false) {
        favorites.push(selectedCountry)
        let icon = favBtn.querySelector("i")
        icon.className = "bi bi-heart-fill"
        console.log("elave olundu")
    }
    else {
        favorites = favorites.filter((item) => item.name.common !== selectedCountry.name.common)
        let icon = favBtn.querySelector("i")
        icon.className = "bi bi-heart"
        console.log("siyahidan cixarildi")
    }

    addfavorite()
});




function updateIcon(country) {
    let icon = favBtn.querySelector("i")
    let chechIcon = favorites.some((fav) => fav.name.common === country.name.common)

    if (chechIcon) {
        icon.className = "bi bi-heart-fill"
    }
    else {
        icon.className = "bi bi-heart"
    }
}


let aiBtn = document.querySelector(".ai-btn")
let aisearchcontainer = document.querySelector(".ai-search-container")
let aiInput = document.querySelector(".ai-input")



aiBtn.addEventListener("click", () => {
    aisearchcontainer.classList.toggle("hidden")


});


const aiSendBtn = document.querySelector('.ai-send-btn');
const aiList = document.querySelector('.aiList');
const aiSidebar = document.querySelector('.ai-sidebar');
const closeAiBtn = document.querySelector('.closeAiBtn');

aiSendBtn.addEventListener("click", () => {
    let value = aiInput.value.trim()
    if (!value == "") {
        getAi(value)
    }
})



function getAi(userText) {
    const api_key = "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";
    aiSidebar.classList.add("active")

    fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${api_key}`
        },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `You are a geography expert. 
        1. Understand user queries in ANY language.
        2. Return ONLY 'CountryName:ISO2' format separated by commas.
        3. IMPORTANT: Always provide 'CountryName' in English (e.g., 'Azerbaijan', not 'Azərbaycan' or 'Rusya').
        4. Use exactly 2-letter ISO codes (e.g., 'AZ', 'TR').
        5. No extra text, no headers, no chat.`
                },
                {
                    role: "user",
                    content: `Suggest countries for: ${userText}`
                }
            ],
            temperature: 0.2
        })
    })
        .then(response => response.json())
        .then(data => {
            let aiText = data.choices[0].message.content;
            // console.log("AI-dan gələn xam mətn:", aiText);


            let countryList = aiText.split(",")
                .map(item => {
                    let cleanItem = item.trim();
                    // \w- nöqtə mötərizə veya boşluq) tapir ve silir
                    cleanItem = cleanItem.replace(/^[0-9\W]+/, "");
                     return cleanItem;
                })
                .filter(item => {
                    const parts = item.split(":");
                    if (parts.length !== 2) return false;

                    const name = parts[0].trim();
                    const code = parts[1].trim();

                    // Başlıqları və yanlış ISO kodlarını (CountryName, ISO2, və s.) ləğv edirik
                    const isHeader = name.toLowerCase().includes("countryname") || name.toLowerCase().includes("iso2");

                    return !isHeader && code.length === 2;
                });
            renderAi(countryList);
        })


        .catch(error => {
            console.log("Error:", error);
        });
}












function renderAi(list) {

    aiList.innerHTML = ""
    aiSidebar.classList.add("active")


    if (!list || list.length === 0) {
        const statusWrapper = document.createElement("div");
        statusWrapper.classList.add("ai-status-wrapper");

        const title = document.createElement("h3");
        title.innerText = "Təəssüf, nəticə tapılmadı";

        const description = document.createElement("p");
        description.innerText = "Daha ətraflı yazmağa çalışın.";

        statusWrapper.append(title, description);
        aiList.append(statusWrapper);
        return;
    }



    list.forEach((item) => {
        let parts = item.split(":")
        let partName = parts[0]
        let partCode = parts[1]

        let newDiv = document.createElement("div")
        newDiv.className = "ai-item"

        let newImg = document.createElement("img")
        newImg.src = `https://flagsapi.com/${partCode.trim().toUpperCase()}/flat/32.png`

        let newSpan = document.createElement("span")
        newSpan.className = "span-ai-name"
        newSpan.innerText = partName.trim()

        newDiv.append(newImg, newSpan)

        newDiv.addEventListener("click", () => {

            countryInput.value = partName.trim()
            searchBtn.click()
            aiSidebar.classList.remove("active")
            aiInput.value = ""
        })
        aiList.append(newDiv)
    })
}


closeAiBtn.addEventListener("click", () => {
    aiSidebar.classList.remove("active");
    aiInput.value = ""
});




// 1. Düyməni və ikonunu sənin verdiyin klaslara görə seçirik
const themeBtn = document.querySelector(".theme-btn.toggle");
const themeIcon = document.querySelector(".theme-icon");

// 2. Səhifə yüklənəndə yaddaşı (localStorage) yoxlayırıq
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark");
    // İkonu günəş (sun) ilə əvəzləyirik
    if (themeIcon) {
        themeIcon.classList.replace("bi-moon-stars", "bi-sun-fill");
    }
}

// 3. Düyməyə basanda rejimi dəyişirik
themeBtn.addEventListener("click", () => {
    // Body-yə 'dark' klasını əlavə edirik (varsa silirik)
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    // 4. Seçimi yaddaşa yazırıq
    localStorage.setItem("theme", isDark ? "dark" : "light");

    // 5. İkonun görünüşünü dəyişirik
    if (isDark) {
        themeIcon.classList.replace("bi-moon-stars", "bi-sun-fill");
    } else {
        themeIcon.classList.replace("bi-sun-fill", "bi-moon-stars");
    }
});