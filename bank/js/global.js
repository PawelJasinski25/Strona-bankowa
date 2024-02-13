// Zmienne do przechowywania danych/wartości domyślnych pomiędzy stronami (zmienne globalne)

let lastPage = "";
let active = "home-button";
let currentTab = "nav-account-tab";
let diagramName = "expenses-week";  // domyślny diagram na stronie głównej
let firstTime;  // zmienna używana na stronie przelewy.html i nowe-zlecenie-stale.html

// Stałe

const ERRORMESSAGE1 = 'Nieprawidłowe dane';
const ERRORMESSAGE2 = 'Brak wystarczających środków na koncie';
const ERRORMESSAGE3 = 'Przekroczono limit znaków';

let expMap = new Map(
    [['MPK - ulgowy, 1 miesiąc', -1],
        ['MPK - ulgowy, 2 miesiące', -2],
        ['MPK - ulgowy, 3 miesiące', -3],
        ['MPK - normalny, 1 miesiąc', -1],
        ['MPK - normalny, 2 miesiące', -2],
        ['MPK - normalny, 3 miesiące', -3],
        ['Park & Ride Kraków', 1],
        ['Autostrada A4  Kraków Katowice', 2],
        ['Autostrada A2  Konin Świecko', 2]]
);

const monthsOrder = [
    "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
    "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

// Funkcja do zmiany strony (a dokładniej: zawartości <main> w index.html)
// params:
//      headerName: tytuł strony wrzucany do h1 w index.html
//      pageURL: ścieżka do danego pliku html
//      func: parametr opcjonalny, do wykonania jakichś funkcji inicjalizujących daną stronę
function loadPage(headerName, pageURL, func = function (){}) {
    if (lastPage !== pageURL) {
        $('#h1-header').html(headerName);
        $('#main').load(pageURL, (response, status) => {
            if (status === "error") {
                console.log("Wystąpił błąd podczas wczytywania pliku.");
                $('#main').html('<div class="text-center">Nie udało się załadować zawartości.</div>');
            }
            else func();
        });
        lastPage = pageURL;
    }
}

// Funkcje do ładowania podstron do index.html (nawigacja)

function loadHomePage() {
    loadPage('Strona główna', 'html-podstrony/strona-glowna.html', () => {
        initializeDiagrams();
        initializeHomePage();
    });
    changeActive('home-button');
}

function loadTransactionsPage() {
    loadPage('Transakcje', 'html-podstrony/transakcje/transakcje.html', () => {
        initializeTransactionsPage();
    });
    changeActive('transactions-button');
}

function loadBankTransfersPage() {
    loadPage('Przelewy', 'html-podstrony/przelewy/przelewy.html', () => {
        initializeForm();
    });
    changeActive('bank-transfers-button');
}

function loadStandingOrdersPage() {
    loadPage('Zlecenia stałe', 'html-podstrony/zlecenia-stale/zlecenia-stale.html');
    changeActive('standing-orders-button');
}

function loadCardsPage() {
    loadPage('Karty', 'html-podstrony/karty/karty.html', () => {
        initializeCardsPage();
    });
    changeActive('cards-button');
}

function loadTicketsPage() {
    loadPage('Bilety', 'html-podstrony/bilety/bilety.html');
    changeActive('tickets-button');
}

function loadSettingsPage() {
    loadPage('Ustawienia', 'html-podstrony/ustawienia/ustawienia.html', () => {
        loadSettings();
    });
    changeActive('settings-button');
}

// Podstrony przelewów

function loadBankTransferConfirmationPage() {
    loadPage('Zatwierdź poprawność danych', 'html-podstrony/przelewy/zatwierdzenie-przelewu.html', () => {
        initializeConfirmationTile();
    });
}

function loadBankTransferDonePage() {
    loadPage('', 'html-podstrony/przelewy/przelew-wykonany.html');
}

// Podstrony kart

function loadCancelCardPage() {
    loadPage('Zastrzeganie karty', 'html-podstrony/karty/zastrzez-karte.html', () => {
        updatePendingCardBlock();
    });
}

function loadCardHasBeenCanceledPage() {
    loadPage('', 'html-podstrony/karty/karta-zastrzezona.html', () => {
        updatePendingCardBlock();
    });
}

// Podstrony biletów

function loadBoughtTicketsPage() {
    loadPage('Zakupione bilety', 'html-podstrony/bilety/zakupione-bilety.html', () => {
        boughtTicketsInit();
        ticketsInformations();
    });
}

function loadTicketsOfferPage() {
    loadPage('Oferta biletów', 'html-podstrony/bilety/oferta-biletow.html', () => {
        showDefaultTicketOfferContent();
    });
}

function loadTicketPurchasePage() {
    loadPage('Zakup biletu', 'html-podstrony/bilety/zakup-biletu.html', () => {
        initializeBuyPage();
        validateTicketPurchase();
    });
}

function loadTicketConfirmationPage() {
    loadPage('', 'html-podstrony/bilety/bilet-potwierdzenie.html', () => {
        displayTicketName();
    });
}

// Podstrony zleceń stałych

function loadActiveStandingOrdersPage() {
    loadPage('Aktywne zlecenia stałe', 'html-podstrony/zlecenia-stale/aktywne-zlecenia-stale.html', () => {
        standingOrderInit()
        standingOrderInformations()
    });
}

function loadNewStandingOrderPage() {
    loadPage('Nowe zlecenie stałe', 'html-podstrony/zlecenia-stale/nowe-zlecenie-stale.html', () => {
        initializeForm();
    });
}

function loadStandingOrderAddedPage() {
    loadPage('', 'html-podstrony/zlecenia-stale/zlecenie-stale-dodane.html');
}

// Funkcja do zmiany aktywnego przycisku w nawigacji

function changeActive(active_page) {
    document.getElementById(active).classList.remove('active');
    document.getElementById(active).classList.add('link-dark');
    document.getElementById(active).removeAttribute('aria-current');

    if (active_page !== 'settings-button' && active_page !== 'logout-button') {
        document.getElementById(active_page).classList.add('active');
    }

    document.getElementById(active_page).classList.remove('link-dark');
    document.getElementById(active_page).ariaCurrent = 'page';

    active = active_page;
}

// Ogólne funkcje pomocnicze

function insertContentInto(selector, content) {
    const selectedElement = document.querySelector(selector);

    if (selectedElement) {
        selectedElement.textContent = content;
    }
}

function setupPopup(modal, btn, close) {
    btn.onclick = function() {
        modal.style.display = "block";
    }

    window.onclick = function(event) {
        if (event.target === modal || event.target === close) {
            modal.style.display = "none";
        }
    }
}

function trimIfTooLong(text, maxTextLength) {
    if (text.length > maxTextLength) {
        return text.substring(0, maxTextLength - 3) + '...';
    }
    else {
        return text;
    }
}

function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function ddmmyyyyFormat(date) {
    return `${padZero(date.getDate())}.${padZero(date.getMonth() + 1)}.${date.getFullYear()}`;
}
  
function padZero(number) {
    return number < 10 ? `0${number}` : number;
}

// Funkcja do ładowania odpowiedniego obrazka karty na zastrzez-karte.html i karta-zastrzezona.html

function updatePendingCardBlock() {
    document.getElementById('card-img').src = "obrazki/" + BankStorage.getPendingCardBlock() + ".png";
    let cardInfo = BankStorage.getPendingCardBlockInformation();
    document.getElementById('card-number').innerHTML = "Numer karty: " + cardInfo[0];
    document.getElementById('card-valid-to').innerHTML = "Ważność: " + cardInfo[1];
}

// Funkcje walidujące pola w formularzach w przelewy.html i nowe-zlecenie-stale.html

function validateBeneficiary() {
    const beneficiaryErrorBox = document.getElementById('beneficiary-error-box');
    const beneficiaryInputField = document.getElementById('beneficiary');
    let beneficiary = beneficiaryInputField.value;

    if (beneficiary !== '') {
        if (beneficiary.length <= 30) {
            beneficiaryErrorBox.style.display = 'none';
            beneficiaryInputField.classList.remove('wrong-input');
        }
        else {
            beneficiaryErrorBox.innerHTML = ERRORMESSAGE3;
            beneficiaryErrorBox.style.display = 'block';
            beneficiaryInputField.classList.add('wrong-input');
        }
    }
    else {
        beneficiaryErrorBox.innerHTML = ERRORMESSAGE1;
        beneficiaryErrorBox.style.display = 'block';
        beneficiaryInputField.classList.add('wrong-input');
    }
}

function validateToNumber(event) {
    const toNumberErrorBox = document.getElementById('to-number-error-box');
    const toNumberInputField = document.getElementById('to-number');

    let toNumber = toNumberInputField.value;
    let result = BankTransfer.handleToNumber(toNumber);
    let msg = result.msg;
    let finalValue = result.finalValue;

    if (msg === OK) {
        toNumberErrorBox.style.display = 'none';
        toNumberInputField.classList.remove('wrong-input');

        if (event.type === 'change') {
            toNumberInputField.value = finalValue;
        }
    }
    else {
        toNumberErrorBox.innerHTML = ERRORMESSAGE1;
        toNumberErrorBox.style.display = 'block';
        toNumberInputField.classList.add('wrong-input');
    }
}

function validateTitle() {
    const titleErrorBox = document.getElementById('title-error-box');
    const titleInputField = document.getElementById('title');
    let title = titleInputField.value;

    if (title !== '') {
        if (title.length <= 30) {
            titleErrorBox.style.display = 'none';
            titleInputField.classList.remove('wrong-input');
        }
        else {
            titleErrorBox.innerHTML = ERRORMESSAGE3;
            titleErrorBox.style.display = 'block';
            titleInputField.classList.add('wrong-input');
        }
    }
    else {
        titleErrorBox.innerHTML = ERRORMESSAGE1;
        titleErrorBox.style.display = 'block';
        titleInputField.classList.add('wrong-input');
    }
}

function validateDate() {
    const dateErrorBox = document.getElementById('date-error-box');
    const dateInputField = document.getElementById('date');

    const dateStr = dateInputField.value;
    const inputDate = new Date(dateStr);
    const currentDate = new Date();

    inputDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (dateInputField.value === '' || inputDate < currentDate) {
        dateErrorBox.innerHTML = ERRORMESSAGE1;
        dateErrorBox.style.display = 'block';
        dateInputField.classList.add('wrong-input');
    }
    else {
        dateErrorBox.style.display = 'none';
        dateInputField.classList.remove('wrong-input');
    }
}

function validateAmount(event) {
    const amountErrorBox = document.getElementById('amount-error-box');
    const amountInputField = document.getElementById('amount');

    const result = Transaction.handleTransactionAmount(amountInputField.value, BankStorage.getAvailableFunds());
    const msg = result.msg;
    const finalInputFieldValue = result.finalInputFieldValue;

    // console.table(result);

    if (msg === INCORRECT) {
        amountErrorBox.innerHTML = ERRORMESSAGE1;
        amountErrorBox.style.display = 'block';
        amountInputField.classList.add('wrong-input');
    }

    if (msg === TOO_MUCH) {
        amountErrorBox.innerHTML = ERRORMESSAGE2;
        amountErrorBox.style.display = 'block';
        amountInputField.classList.add('wrong-input');
    }

    if (msg === OK) {
        amountErrorBox.style.display = 'none';
        amountInputField.classList.remove('wrong-input');

        if (event.type === 'change') {
            amountInputField.value = finalInputFieldValue;
        }
    }
}

function validateSOAmount(event) {
    const amountErrorBox = document.getElementById('amount-error-box');
    const amountInputField = document.getElementById('amount');

    const result = Transaction.handleTransactionAmount(amountInputField.value, BankStorage.getAvailableFunds());
    const msg = result.msg;
    const finalInputFieldValue = result.finalInputFieldValue;

    if (msg === INCORRECT) {
        amountErrorBox.innerHTML = ERRORMESSAGE1;
        amountErrorBox.style.display = 'block';
        amountInputField.classList.add('wrong-input');
    }

    if (msg === TOO_MUCH || msg === OK) {
        amountErrorBox.style.display = 'none';
        amountInputField.classList.remove('wrong-input');

        if (event.type === 'change') {
            amountInputField.value = finalInputFieldValue;
        }
    }
}

function validateEndDate() {
    const termless = document.getElementById('termless');

    const endDateErrorBox = document.getElementById('end-date-error-box');
    const endDateInputField = document.getElementById('end-date');

    const dateInputField = document.getElementById('date');

    if (!termless.checked) {
        endDateInputField.disabled = false;

        const endDate = new Date(endDateInputField.value);
        const startDate = new Date(dateInputField.value);

        endDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);

        if (endDateInputField.value === '' || endDate < startDate) {
            endDateErrorBox.innerHTML = ERRORMESSAGE1;
            endDateErrorBox.style.display = 'block';
            endDateInputField.classList.add('wrong-input');
        }
        else {
            endDateErrorBox.style.display = 'none';
            endDateInputField.classList.remove('wrong-input');
        }
    }
    else {
        endDateInputField.disabled = true;

        endDateErrorBox.style.display = 'none';
        endDateInputField.classList.remove('wrong-input');
    }
}
