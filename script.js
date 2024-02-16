function getListSession() {
    let listElement = document.querySelector(".mentorListSession .crud-list");

    if (listElement) {
        return listElement;
    } else {
        console.log(
            "Element avec la classe 'crud-list' non trouvé à l'intérieur de mentorListSession."
        );
    }
}

function getListSessionFirstItem() {
    let listElement = getListSession();
    let itemsListElement = getListSessionItems(listElement);
    return itemsListElement[0];
}

function getListSessionItems(listElement) {
    let trElements = listElement.querySelectorAll("tbody tr");

    if (trElements.length > 0) {
        console.log("Nombre d'éléments <tr> : " + trElements.length);
        return trElements;
    } else {
        console.log("Aucun élément <tr> trouvé à l'intérieur du <tbody>.");
    }
}

function getListSessionItemDate(tdElement) {
    let itemDate = tdElement.querySelector("td:nth-child(1) a").textContent;
    // Supprimer les retours à la ligne de la chaîne
    itemDate = itemDate.replace(/[\n\r]/g, "");
    return itemDate;
}

function getListSessionItemStudentname(tdElement) {
    let itemStudentname =
        tdElement.querySelector("td:nth-child(2) a").textContent;
    // Supprimer les retours à la ligne de la chaîne
    itemStudentname = itemStudentname.replace(/[\n\r]/g, "");
    return itemStudentname;
}

function getListSessionItemStatus(tdElement) {
    let itemStatus = tdElement.querySelector("td:nth-child(3)").textContent;
    // Supprimer les retours à la ligne de la chaîne
    itemStatus = itemStatus.replace(/[\n\r]/g, "");
    return itemStatus;
}

function getListSessionItemType(tdElement) {
    let itemType = tdElement.querySelector("td:nth-child(4)").textContent;
    // Supprimer les retours à la ligne de la chaîne
    itemType = itemType.replace(/[\n\r]/g, "");
    return itemType;
}

function getListSessionItemExpertiseLevel(tdElement) {
    let itemExpertiseLevelElement = tdElement.querySelector(
        "td:nth-child(5) span"
    );

    // Vérifier si l'élément existe
    if (itemExpertiseLevelElement) {
        let itemExpertiseLevel = itemExpertiseLevelElement.textContent.trim();

        // Vérifier si le texte est vide
        if (itemExpertiseLevel !== "") {
            return itemExpertiseLevel;
        }
    }

    // Si l'élément n'existe pas ou n'a pas de texte, renvoyer 0
    return "0";
}

// Fonction isEqual pour comparer deux objets
function isEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function formatFrenchDateToYYYMMDD(dateString) {
    const regexp =
        /^(\d{1,2})\s+([\wÀ-Öà-ö\u00E0-\u00FF]+)\s+(\d{4})\s*(?:à\s+(\d{1,2})(?::(\d{2})?)?)?$/i;

    const match = dateString.match(regexp);

    if (match) {
        const [, day, monthStr, year, hours, minutes] = match;
        const months = {
            janvier: "01",
            février: "02",
            mars: "03",
            avril: "04",
            mai: "05",
            juin: "06",
            juillet: "07",
            août: "08",
            septembre: "09",
            octobre: "10",
            novembre: "11",
            décembre: "12",
        };

        const month = months[monthStr.toLowerCase()];

        return new Date(year, month - 1, day, hours || 0, minutes || 0)
            .toISOString()
            .split("T")[0];
    }

    return null;
}

function addCurrentListElementToMyBDD() {
    let listElement = getListSession();
    let itemsListElement = getListSessionItems(listElement);
    let myBDD = JSON.parse(localStorage.getItem("myBDD")) || [];

    itemsListElement.forEach((tdElement, tdIndex) => {
        let itemObject = {
            date: getListSessionItemDate(tdElement),
            dateFormated: formatFrenchDateToYYYMMDD(
                getListSessionItemDate(tdElement)
            ),
            studentname: getListSessionItemStudentname(tdElement),
            status: getListSessionItemStatus(tdElement),
            type: getListSessionItemType(tdElement),
            expertiseLevel: getListSessionItemExpertiseLevel(tdElement),
        };

        // Vérifier si itemObject n'est pas déjà présent dans myBDD
        if (!myBDD.some((item) => isEqual(item, itemObject))) {
            // Ajouter itemObject à myBDD
            myBDD.push(itemObject);
        }
    });

    localStorage.setItem("myBDD", JSON.stringify(myBDD));

    console.log(myBDD);
}

function findElementByTextContent(selector, text) {
    const elements = document.querySelectorAll(selector);

    for (const element of elements) {
        if (element.textContent.includes(text)) {
            return element;
        }
    }

    return null;
}

function followingPageExist() {
    const arrowRight = document.querySelector(".paginationContent .arrowRight");
    if (arrowRight) {
        return 1;
    }
    return 0;
}

function goToNextPage() {
    const arrowRight = document.querySelector(".paginationContent .arrowRight");
    const arrowRightClickable = arrowRight.closest("a");
    arrowRightClickable.click();
}

function waitDuration(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

async function addButtonStartScrapping() {
    const h2SessionsDeMentorat = findElementByTextContent(
        "h2",
        "Sessions de mentorat"
    );
    let buttonStartScrapping = document.createElement("button");
    buttonStartScrapping.className =
        "StartScrapping mentorProfile__button button button--primary";
    buttonStartScrapping.textContent = "Start Scrapping";

    buttonStartScrapping.addEventListener("click", async function () {
        let currentFirstItem = getListSessionFirstItem();
        addCurrentListElementToMyBDD();

        let loopCounter = 0;
        const maxLoops = 10; // Définissez la limite de boucles pour éviter une boucle infinie

        while (followingPageExist() == 1 && loopCounter < maxLoops) {
            goToNextPage();
            let newFirstItem = getListSessionFirstItem();

            const updateNewFirstItem = async () => {
                await waitDuration(500);
                newFirstItem = getListSessionFirstItem();
            };

            while (currentFirstItem == newFirstItem) {
                await updateNewFirstItem();
                loopCounter++;

                if (loopCounter >= maxLoops) {
                    console.log(
                        "Arrêt de la boucle pour éviter une boucle infinie."
                    );
                    break;
                }
            }

            addCurrentListElementToMyBDD();
        }

        console.log("Fin du scraping");
    });

    h2SessionsDeMentorat.insertAdjacentElement(
        "afterend",
        buttonStartScrapping
    );
}

function displayMyBDD() {
    // Récupérer le tableau d'objets depuis le localStorage
    const myBDDString = localStorage.getItem("myBDD");

    // Vérifier si le tableau existe dans le localStorage
    if (myBDDString) {
        // Convertir la chaîne JSON en un tableau d'objets
        const myBDD = JSON.parse(myBDDString);

        // Afficher le tableau d'objets dans la console
        console.log(myBDD);
    } else {
        console.log(
            'Aucun tableau d\'objets sous la clé "myBDD" dans le localStorage.'
        );
    }
}

function displayNumberOfSessionsDone() {
    // Récupérer le tableau d'objets depuis le localStorage
    const myBDDString = localStorage.getItem("myBDD");

    // Vérifier si le tableau existe dans le localStorage
    if (myBDDString) {
        // Convertir la chaîne JSON en un tableau d'objets
        const myBDD = JSON.parse(myBDDString);

        // Filtrer les objets ayant "status" égal à "Réalisée" et "type" égal à une chaîne vide
        const filteredObjects = myBDD.filter(
            (obj) => obj.status === "Réalisée" && obj.type === ""
        );

        // Afficher le nombre d'objets filtrés dans la console
        console.log("Nombre de sessions réalisées :", filteredObjects.length);
    } else {
        console.log(
            'Aucun tableau d\'objets sous la clé "myBDD" dans le localStorage.'
        );
    }
}

function displayNumberOfSoutenancesDone() {
    // Récupérer le tableau d'objets depuis le localStorage
    const myBDDString = localStorage.getItem("myBDD");

    // Vérifier si le tableau existe dans le localStorage
    if (myBDDString) {
        // Convertir la chaîne JSON en un tableau d'objets
        const myBDD = JSON.parse(myBDDString);

        // Filtrer les objets ayant "status" égal à "Réalisée" et "type" égal à une chaîne vide
        const filteredObjects = myBDD.filter(
            (obj) => obj.status === "Réalisée" && obj.type === "Soutenance"
        );

        // Afficher le nombre d'objets filtrés dans la console
        console.log(
            "Nombre de soutenances réalisées :",
            filteredObjects.length
        );
    } else {
        console.log(
            'Aucun tableau d\'objets sous la clé "myBDD" dans le localStorage.'
        );
    }
}

function displayNumberOfStudentsSession() {
    // Récupérer le tableau d'objets depuis le localStorage
    const myBDDString = localStorage.getItem("myBDD");

    // Vérifier si le tableau existe dans le localStorage
    if (myBDDString) {
        // Convertir la chaîne JSON en un tableau d'objets
        const myBDD = JSON.parse(myBDDString);

        // Filtrer les objets ayant "status" égal à "Réalisée" et "type" égal à une chaîne vide
        const filteredObjects = myBDD.filter(
            (obj) => obj.status === "Réalisée" && obj.type === ""
        );

        // Utiliser un ensemble pour stocker les noms uniques
        const uniqueStudentNames = new Set();

        // Parcourir les objets filtrés et ajouter les noms à l'ensemble
        filteredObjects.forEach((obj) =>
            uniqueStudentNames.add(obj.studentname)
        );

        // Afficher le nombre d'éléments uniques dans la console
        console.log(
            "Nombre d'étudiants suivis en session :",
            uniqueStudentNames.size
        );
    } else {
        console.log(
            'Aucun tableau d\'objets sous la clé "myBDD" dans le localStorage.'
        );
    }
}

function displayNumberOfStudentsSoutenance() {
    // Récupérer le tableau d'objets depuis le localStorage
    const myBDDString = localStorage.getItem("myBDD");

    // Vérifier si le tableau existe dans le localStorage
    if (myBDDString) {
        // Convertir la chaîne JSON en un tableau d'objets
        const myBDD = JSON.parse(myBDDString);

        // Filtrer les objets ayant "status" égal à "Réalisée" et "type" égal à une chaîne vide
        const filteredObjects = myBDD.filter(
            (obj) => obj.status === "Réalisée" && obj.type === "Soutenance"
        );

        // Utiliser un ensemble pour stocker les noms uniques
        const uniqueStudentNames = new Set();

        // Parcourir les objets filtrés et ajouter les noms à l'ensemble
        filteredObjects.forEach((obj) =>
            uniqueStudentNames.add(obj.studentname)
        );

        // Afficher le nombre d'éléments uniques dans la console
        console.log(
            "Nombre d'étudiants suivis en soutenance :",
            uniqueStudentNames.size
        );
    } else {
        console.log(
            'Aucun tableau d\'objets sous la clé "myBDD" dans le localStorage.'
        );
    }
}

function displayNumberOfStudentsSessionAndSoutenance() {
    // Récupérer le tableau d'objets depuis le localStorage
    const myBDDString = localStorage.getItem("myBDD");

    // Vérifier si le tableau existe dans le localStorage
    if (myBDDString) {
        // Convertir la chaîne JSON en un tableau d'objets
        const myBDD = JSON.parse(myBDDString);

        // Filtrer les objets ayant "status" égal à "Réalisée" et ayant "type" égal à une chaîne vide ou "Soutenance"
        const filteredObjects = myBDD.filter(
            (obj) =>
                obj.status === "Réalisée" &&
                (obj.type === "" || obj.type === "Soutenance")
        );

        // Utiliser un ensemble pour stocker les noms uniques
        const uniqueStudentNames = new Set();

        // Parcourir les objets filtrés et ajouter les noms à l'ensemble
        filteredObjects.forEach((obj) =>
            uniqueStudentNames.add(obj.studentname)
        );

        // Afficher le nombre d'éléments uniques dans la console
        console.log(
            "Nombre d'étudiants suivis en session et soutenance :",
            uniqueStudentNames.size
        );
    } else {
        console.log(
            'Aucun tableau d\'objets sous la clé "myBDD" dans le localStorage.'
        );
    }
}

addButtonStartScrapping();
// Ceci déclenche le script au chargement de la page
// let startScrappingElement = document.querySelector('.StartScrapping');
// startScrappingElement.click();

displayMyBDD();
displayNumberOfSessionsDone();
displayNumberOfSoutenancesDone();
displayNumberOfStudentsSession();
displayNumberOfStudentsSoutenance();
displayNumberOfStudentsSessionAndSoutenance();
