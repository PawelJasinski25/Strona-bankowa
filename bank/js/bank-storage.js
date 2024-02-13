/*

Idea:
- wszystkie dane potrzebne do działania aplikacji przechowujemy w localStorage
- localStorage to takie miejsce do przechowywania danych, które jest w przeglądarce
- localStorage pozwala przechowywać w przeglądarce pary klucz-wartość
- pary te przeżywają nawet gdy się zamknie okno przeglądarki
- w localStorage można przechowywać niewiele danych, około 5-10 MB
- w localStorage można przechowywać tylko dane typu string

Metody:
localStorage.setItem('key', 'item')
localStorage.getItem('key')
localStorage.removeItem('key')
localStorage.clear()

Ponieważ localStorage może przechowywać tylko dane typu string, 
to aby zapisać tam jakieś bardziej skomplikowane obiekty, 
na przykład jakąś tablicę, 
to musimy je najpierw zamienić na string za pomocą JSON.stringify()

localStorage.setItem('key', JSON.stringify(item))

Aby potem odczytać taki obiekt z local storage, 
musimy zamienić stringową reprezentację tego obiektu, na ten właśnie obiekt, 
robimy to za pomocą metody JSON.parse()

JSON.parse(localStorage.getItem('key'))

W localStorage możemy przechowywać wszystkie dane banku, 
na przykład numer konta, albo wszystkie wykonane transakcje

Pomysł jest taki, że inicjalizujemy localStorage, gdy wchodzimy po raz pierwszy na stronę główną, 
od tego czasu zaczyna się sesja na stronie banku

Sesja trwa do momentu, gdy klikniemy na przycisk "Wyloguj", 
wtedy localStorage jest czyszczone, 
czyli usuwane są np. dane o wszystkich przelewach wykonanych podczas sesji

*/

// Klucze
const USERNAME = 'username';
const ACCOUNT_NAME = 'account name';
const ACCOUNT_NUMBER = 'account number';
const AVAILABLE_FUNDS = 'available funds';
const TRANSACTIONS = 'transactions';
const PENDING_BANK_TRANSFER = 'pending-bank-transfer';
const PENDING_CARD_BLOCK = 'pending-card-block';
const PENDING_CARD_BLOCK_INFORMATION = 'pending-card-block-information';
const BLOCKED_CARDS = 'blocked-cards';
const TICKET_NAME = 'ticket name';
const TICKET_PRICE = 'ticket price'
const TICKETS = 'tickets';
const STANDING_ORDERS = 'standing orders';
const OPTIONS_CHECKBOXES = 'options checkboxes';

// Typy transakcji
const EXPENSE = "expense";
const REVENUE = "revenue";

// Pomocnicze stałe
const INCORRECT = 'incorrect';
const TOO_MUCH = 'too much';
const OK = 'ok';

// Klasy

class Transaction {
    constructor(title, date, amount, type) {
        this.title = title;
        this.date = date;
        this.amount = amount;
        this.type = type;
    }

    // Funkcja utworzona głównie dla spójności z klasami potomnymi
    static getAllInfo(transaction) {
        return {
            'Typ operacji': 'Transakcja',
            'Tytuł': transaction.title,
            'Data': transaction.date,
            'Kwota': formatMoney(transaction.amount)
        };
    };

    // Funkcja pomocnicza do sprawdzania czy pole w formularzu jest poprawnie wypełnione
    static handleTransactionAmount(transactionAmount, availableFunds) {
        let withoutWhiteSpaces = removeWhiteSpaces(transactionAmount);

        // zamieniamy przecinki na kropki, ponieważ zakładamy, że 
        // użytkownik może wpisać liczby typu float i z kropką i z przecinkiem, ale 
        // żeby JavaScript poprawnie porównała liczby typu float, musimy mieć kropkę
        let formatted = withoutWhiteSpaces.replace(/,/g, '.');

        let msg;
        let finalInputFieldValue;
        let finalBankStorageValue;

        // sprawdzamy ogólnie czy mamy numer czy nie
        let isNotNumber = !(/^[\s\d]+(?:[.,])?(?:[\s\d]+)?$/.test(formatted));

        // poprzedni regex nie uwzględnia przypadku liczb typu ,25 albo .25 (czyli 0,25 albo 0.25)
        let isNotDecimal = !(/^\s*[.,][\s\d]+$/.test(formatted));

        if ((isNotNumber && isNotDecimal) || formatted === '') {
            msg = INCORRECT;
        }
        else if (parseFloat(formatted) > parseFloat(availableFunds)) {
            msg = TOO_MUCH;
        }
        else if (parseFloat(formatted) <= 0) {
            msg = INCORRECT;
        }
        else {
            msg = OK;
        }

        if (msg === TOO_MUCH || msg === OK) {
            // jak jesteśmy tutaj, to znaczy, że chcemy formatować
            finalBankStorageValue = parseFloat(formatted);

            // jeżeli mamy liczbę rzeczywistą, 
            // to pozwalamy na co najwyżej dwie cyfry po przecinku
            if (formatted.includes('.')) {
                finalBankStorageValue = finalBankStorageValue.toFixed(2);
            }

            finalInputFieldValue = finalBankStorageValue;

            // zamieniliśmy wcześniej przecinki na kropki, 
            // więc jeżeli w oryginale był przecinek, to go teraz przywracamy
            if (transactionAmount.includes(',')) {
                finalInputFieldValue = finalInputFieldValue.replace(/\./g, ',');
            }
        }
    
        return { msg, finalInputFieldValue, finalBankStorageValue };
    }
}

class BankTransfer extends Transaction {
    constructor(fromAccount, fromNumber, beneficiary, toNumber, title, date, amount, type) {
        super(title, date, amount, type);
        this.fromAccount = fromAccount;
        this.fromNumber = fromNumber;
        this.beneficiary = beneficiary;
        this.toNumber = toNumber;
    }

    // Funkcja pomocnicza do wyświetlania informacji o przelewie w pop-upie na stronie z transakcjami
    static getAllInfo(bankTransfer) {
        return {
            'Typ operacji': 'Przelew na konto',
            'Konto nadawcy': bankTransfer.fromAccount,
            'Numer nadawcy': bankTransfer.fromNumber,
            'Beneficjent': bankTransfer.beneficiary,
            'Numer beneficjenta': bankTransfer.toNumber,
            'Tytuł': bankTransfer.title,
            'Data': bankTransfer.date,
            'Kwota': formatMoney(bankTransfer.amount)
        };
    }

    // Funkcja pomocnicza do sprawdzania czy numer odbiorcy przelewu jest poprawny
    // Zakładamy, że jest poprawny, gdy zawiera same cyfry (i ewentualnie białe znaki, np. spacje)
    // i gdy jego długość wynosi 9 (numer telefonu) lub 26 (numer konta)
    static handleToNumber(toNumber) {
        let msg = INCORRECT;
        let finalValue = toNumber;
        
        const withoutWhiteSpaces = removeWhiteSpaces(toNumber);
        const areThereOnlyDigits = /^\d+$/.test(withoutWhiteSpaces);
    
        if (areThereOnlyDigits) {
            const length = withoutWhiteSpaces.length;

            if (length === 9) {
                msg = OK;
                finalValue = formatPhoneNumber(toNumber);
            }

            if (length === 26) {
                msg = OK;
                finalValue = longFormatAccNum(toNumber);
            }
        }

        return { msg, finalValue };
    }
}

class Ticket extends Transaction {
    constructor(validFrom, validTo, owner, title, date, amount) {
        super(title, date, amount, EXPENSE);
        this.validFrom = validFrom;
        this.validTo = validTo;
        this.owner = owner;
    }

    // Funkcja pomocnicza do wyświetlania informacji o bilecie w pop-upie na stronie z transakcjami
    static getAllInfo(ticket) {
        return {
            'Typ operacji': 'Zakup biletu',
            'Rodzaj biletu': ticket.title,
            'Data zakupu': ticket.date,
            'Cena zakupu': formatMoney(ticket.amount),
            'Bilet ważny od': ticket.validFrom,
            'Bilet ważny do': ticket.validTo,
            'Posiadacz': ticket.owner
        };
    }

    static handleTicketAmount(ticketAmount, availableFunds) {
        let msg;

        if (ticketAmount > parseFloat(availableFunds)) {
            msg = TOO_MUCH;
        }
        else {
            msg = OK;
        }

        return msg;
    }
}

class StandingOrder {
    constructor(from, beneficiary, toNumber, title, amount, startDate, frequency, endDate) {
        this.from = from;
        this.beneficiary = beneficiary;
        this.toNumber = toNumber;
        this.title = title;
        this.amount = amount;
        this.startDate = startDate;
        this.frequency = frequency;    // możliwe wartości: 'every-week', 'every-month', 'every-quarter'
        this.endDate = endDate;    // jak ma być bezterminowo, to przyjujemy, że wartość tego atrybutu to string 'termless'
    }
}

class BankStorage {
    static getDefaultUsername() {
        return 'Jan Młynarz';
    }

    static getDefaultAccountName() {
        return 'Konto dla młodych';
    }

    static getDefaultAccountNumber() {
        return '12 2817 5019 2380 0000 0003 3456';
    }

    static getDefaultAvailableFunds() {
        return '925.34';
    }

    static getDefaultTransactions() {
        const username = this.getDefaultUsername();
        const accountName = this.getDefaultAccountName();
        const accountNumber = this.getDefaultAccountNumber();
        
        const t1 = new BankTransfer(
            accountName, 
            accountNumber, 
            'Budka z kebabami \'Pod Kebabem\'', 
            '123 456 789', 
            'Kebab', 
            '08.12.2023', 
            '25', 
            EXPENSE
        );

        const t2 = new BankTransfer(
            'Konto UJ', 
            '00 0000 0000 0000 0000 0000 0000', 
            username, 
            accountNumber, 
            'Stypendium',
            '07.12.2023', 
            '800', 
            REVENUE
        );
        
        const t3 = new BankTransfer(
            accountName, 
            accountNumber, 
            'MPK Kraków', 
            '99 8888 7777 6666 5555 4444 3333', 
            'Mandat', 
            '06.12.2023', 
            '150', 
            EXPENSE
        );

        const t4 = new BankTransfer(
            accountName, 
            accountNumber, 
            'RTV Euro AGD', 
            '222 111 000', 
            'Zakup monitora', 
            '30.11.2023', 
            '959.66', 
            EXPENSE
        );

        const t5 = new BankTransfer(
            'Konto cichego wielbiciela', 
            '128 516 131', 
            username, 
            accountNumber, 
            'Prezent', 
            '15.11.2023', 
            '40', 
            REVENUE
        );

        const t6 = new BankTransfer(
            'Konto UJ', 
            '00 0000 0000 0000 0000 0000 0000', 
            username, 
            accountNumber, 
            'Stypendium',
            '01.11.2023', 
            '800', 
            REVENUE
        );

        return [t6, t5, t4, t3, t2, t1];
    }

    static getDefaultTickets() {
        const username = this.getDefaultUsername();
        const defaultTicket = new Ticket('13.01.2024', '14.01.2024', username, 'Park & Ride Kraków', '13.01.2024', '10');
        return [defaultTicket];
    }

    static getDefaultStandingOrders() {
        const username = this.getDefaultUsername();

        const so1 = new StandingOrder(
            username,
            'KNPP Bank',
            '42 4242 4242 4242 4242 4242 4242',
            'Raty kredytu',
            '600',
            '01.03.2024',
            'every-quarter',
            '01.03.2027'
        );

        const so2 = new StandingOrder(
            username,
            'Spółka mieszkaniowa',
            '242 424 242',
            'Czynsz',
            '1000',
            '28.02.2024',
            'every-month',
            '28.02.2025'
        );

        return [so1, so2];
    }

    static getDefaultOptionsCheckboxes() {
        return ['checkbox-2'];
    }

    static initialize() {
        const username = this.getDefaultUsername();
        const accountName = this.getDefaultAccountName();
        const accountNumber = this.getDefaultAccountNumber();
        const availableFunds = this.getDefaultAvailableFunds();
        const transactions = this.getDefaultTransactions();

        const tickets = this.getDefaultTickets();
        for (let ticket of tickets) {
            transactions.push(ticket);
        }

        const standingOrders = this.getDefaultStandingOrders();
        const optionsCheckboxes = this.getDefaultOptionsCheckboxes();
    
        this.setUsername(username);
        this.setAccountName(accountName);
        this.setAccountNumber(accountNumber);
        this.setAvailableFunds(availableFunds);
        this.setTransactions(transactions);
        this.setTickets(tickets);
        this.setStandingOrders(standingOrders);
        this.setOptionsCheckboxes(optionsCheckboxes);
    }

    static clear() {
        localStorage.clear();
    }

    // Username
    static getUsername() {
        return localStorage.getItem(USERNAME);
    }
    static setUsername(username) {
        localStorage.setItem(USERNAME, username);
    }
    static removeUsername() {
        localStorage.removeItem(USERNAME);
    }

    // Account name
    static getAccountName() {
        return localStorage.getItem(ACCOUNT_NAME);
    }
    static setAccountName(accountName) {
        localStorage.setItem(ACCOUNT_NAME, accountName);
    }
    static removeAccountName() {
        localStorage.removeItem(ACCOUNT_NAME);
    }

    // Account number
    static getAccountNumber() {
        return localStorage.getItem(ACCOUNT_NUMBER);
    }
    static setAccountNumber(accountNumber) {
        localStorage.setItem(ACCOUNT_NUMBER, accountNumber);
    }
    static removeAccountNumber() {
        localStorage.removeItem(ACCOUNT_NUMBER);
    }

    // Available funds
    static getAvailableFunds() {
        return localStorage.getItem(AVAILABLE_FUNDS);
    }
    static setAvailableFunds(availableFunds) {
        localStorage.setItem(AVAILABLE_FUNDS, parseFloat(availableFunds).toFixed(2));
    }
    static removeAvailableFunds() {
        localStorage.removeItem(AVAILABLE_FUNDS);
    }

    // Transactions
    static getTransactions() {
        return JSON.parse(localStorage.getItem(TRANSACTIONS));
    }
    static setTransactions(transactions) {
        localStorage.setItem(TRANSACTIONS, JSON.stringify(transactions));
    }
    static removeTransactions() {
        localStorage.removeItem(TRANSACTIONS);
    }

    // Pending bank transfer
    static getPendingBankTransfer() {
        return JSON.parse(localStorage.getItem(PENDING_BANK_TRANSFER));
    }
    static setPendingBankTransfer(pendingBankTransfer) {
        localStorage.setItem(PENDING_BANK_TRANSFER, JSON.stringify(pendingBankTransfer));
    }
    static removePendingBankTransfer() {
        localStorage.removeItem(PENDING_BANK_TRANSFER);
    }

    // Pending card block
    static getPendingCardBlock() {
        return localStorage.getItem(PENDING_CARD_BLOCK);
    }
    static setPendingCardBlock(card) {
        return localStorage.setItem(PENDING_CARD_BLOCK, card);
    }

    // Pending card block information
    static getPendingCardBlockInformation() {
        return JSON.parse(localStorage.getItem(PENDING_CARD_BLOCK_INFORMATION));
    }
    static setPendingCardBlockInformation(cardNumber, validTo) {
        return localStorage.setItem(PENDING_CARD_BLOCK_INFORMATION, JSON.stringify([cardNumber, validTo]));
    }

    // Blocked cards
    static getBlockedCards() {
        return JSON.parse(localStorage.getItem(BLOCKED_CARDS))
    }
    static setBlockedCards(blockedCards) {
        return localStorage.setItem(BLOCKED_CARDS, JSON.stringify(blockedCards));
    }

    // Ticket name
    static getTicketName() {
        return localStorage.getItem(TICKET_NAME);
    }
    static setTicketName(name) {
        return localStorage.setItem(TICKET_NAME, name);
    }

    // Ticket price
    static getTicketPrice() {
        return localStorage.getItem(TICKET_PRICE)
    }
    static setTicketPrice(price) {
        return localStorage.setItem(TICKET_PRICE, price.replace(/,/g, '.'));
    }

    // Tickets
    static getTickets() {
        return JSON.parse(localStorage.getItem(TICKETS));
    }
    static setTickets(tickets) {
        localStorage.setItem(TICKETS, JSON.stringify(tickets));
    }

    // Standing orders
    static getStandingOrders() {
        return JSON.parse(localStorage.getItem(STANDING_ORDERS));
    }
    static setStandingOrders(standingOrders) {
        localStorage.setItem(STANDING_ORDERS, JSON.stringify(standingOrders));
    }
    static removeStandingOrder(standingOrder) {
        const standingOrders = this.getStandingOrders();
        let index = -1;

        for (let i = 0; i < standingOrders.length; i++) {
            if (JSON.stringify(standingOrders[i]) === JSON.stringify(standingOrder)) {
                index = i;
                break;
            }
        }
        
        if (index > -1) {
            standingOrders.splice(index, 1);
        }

        this.setStandingOrders(standingOrders);

        return index;
    }

    // Options checkboxes
    static getOptionsCheckboxes() {
        return JSON.parse(localStorage.getItem(OPTIONS_CHECKBOXES));
    }
    static setOptionsCheckboxes(optionsCheckboxes) {
        localStorage.setItem(OPTIONS_CHECKBOXES, JSON.stringify(optionsCheckboxes));
    }

    // Funkcje dodające nową transakcje, nową zablokowaną kartę, nowy zakupiony bilet, nowe zlecenie stałe

    static makeATransaction(transaction) {
        const transactions = this.getTransactions();
        transactions.push(transaction);
        this.setTransactions(transactions);

        this.setAvailableFunds(parseFloat(this.getAvailableFunds()) - transaction.amount);
    }

    static addBlockedCard() {
        let blockedCards = this.getBlockedCards();

        if (blockedCards === undefined || blockedCards === null) {
            blockedCards = [this.getPendingCardBlock()];
        }
        else blockedCards.push(this.getPendingCardBlock());

        this.setBlockedCards(blockedCards);
    }

    static buyATicket(ticket) {
        const tickets = this.getTickets()
        tickets.push(ticket);
        this.setTickets(tickets);
    }

    static addStandingOrder(standingOrder) {
        const standingOrders = this.getStandingOrders();
        standingOrders.push(standingOrder);
        this.setStandingOrders(standingOrders);
    }
}

// Funkcje pomocnicze

function removeWhiteSpaces(str) {
    return str.replace(/\s/g, '');
}

// Funkcje formatujące

function shortFormatAccNum(accountNumber) {
    let withoutWhiteSpaces = removeWhiteSpaces(accountNumber);

    const firstTwoDigits = withoutWhiteSpaces.substring(0, 2);
    const lastFourDigits = withoutWhiteSpaces.slice(-4);

    return `${firstTwoDigits} (...) ${lastFourDigits}`;
}

function longFormatAccNum(accountNumber) {
    let withoutWhiteSpaces = removeWhiteSpaces(accountNumber);
    return `${withoutWhiteSpaces.slice(0, 2)} ${withoutWhiteSpaces.slice(2).match(/.{1,4}/g).join(' ')}`;
}

function formatMoney(money) {
    let withoutWhiteSpaces = removeWhiteSpaces(money);
    return `${parseFloat(withoutWhiteSpaces).toFixed(2).replace(/\./g, ',')} zł`;
}

function formatPhoneNumber(phoneNumber) {
    let withoutWhiteSpaces = removeWhiteSpaces(phoneNumber);
    return withoutWhiteSpaces.match(/.{1,3}/g).join(' ');
}

function formatFrequency(freq) {
    switch (freq) {
        case 'every-week':
            return 'Co tydzień';
        case 'every-month':
            return 'Co miesiąc';
        case 'every-quarter':
            return 'Co 3 miesiące';
        default:
            return freq;
    }
}

function formatIfTermless(endDate) {
    if (endDate === 'termless') {
        return 'Bezterminowo';
    } else {
        return endDate;
    }
}
