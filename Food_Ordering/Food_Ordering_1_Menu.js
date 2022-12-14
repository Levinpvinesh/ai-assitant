// {Name: Food_Ordering}
// {Description: Food Ordering demo app for delivering food}

/*
This is a script for Food Ordering demo app for delivering food
Now there are four categories for food: drinks, pizza, street food, desserts.
*/

onCreateUser(p => {
    p.userData.clarifyCategory = {en: ""};
    p.userData.clarifyCategoryItems = {en: ""};
});


project.menu = {
    "drink": [
        {id: "sod", title: "Cola", price: 2, type: "drink", alt: ["Coca-cola", "Soda", "Coca cola", "Coke", "Diet Coke"]},
        {id: "amr", title: "Americano", price: 1, type: "drink", alt: ["coffee"]},
        {id: "lat", title: "Latte", price: 3, type: "drink"},
        {id: "cap", title: "Cappuccino", price: 3, type: "drink"},
        {id: "orj", title: "Orange juice", price: 3, type: "drink"},
        {id: "tea", title: "Tea", price: 3, type: "drink"}
    ],
    "pizza": [
        {id: "prn", title: "Pepperoni", price: 14, type: "pizza", alt: ["Pepperoni pizza"]},
        {id: "mrg", title: "Margarita", price: 10, type: "pizza", alt: ["Margarita pizza"]},
        {id: "4ch", title: "Cheese", price: 10, type: "pizza", alt: ["Cheese pizza"]},
        {id: "haw", title: "Hawaiian", price: 10, type: "pizza", alt: ["Hawaiian pizza"]}
    ],
    "street food": [
        {id: "brt", title: "Burrito", price: 12, type: "street food"},
        {id: "brg", title: "Burger", price: 23, type: "street food"},
        {id: "tco", title: "Taco", price: 10, type: "street food"},
        {id: "snd", title: "Sandwich", price: 10, type: "street food"}
    ],
    "dessert": [
        {id: "apl", title: "Apple pie", price: 5, type: "dessert", alt: ["pie"]},
        {id: "chc", title: "Cheesecake", price: 15, type: "dessert"}
    ]
};

const AVAILABLE_ITEMS = _.reduce(project.menu, (a, category) => {
    category.forEach(item => {
        a[item.id] = [item.title.toLowerCase()];
        if (item.alt) {
            item.alt.forEach(alt => a[item.id].push(alt.toLowerCase()))
        }
    });
    return a;
}, {});

const AVAILABLE_ITEMS_INTENT = _.flatten(Object.keys(AVAILABLE_ITEMS).map(id => AVAILABLE_ITEMS[id].map(alt => alt + '_' + '~' + id))).join('|');

project.AVAILABLE_ITEMS_BY_ID = _.reduce(project.menu, (a, category) => {
    category.forEach(item => a[item.id] = item);
    return a;
}, {});

project.unavailableDishes = [
    "Spaghetti",
    "Bruschetta",
    "Chicken Parmigiana",
    "Panini",
    "Panna Cotta",
    "Tramezzino",
    "Tiramisu",
    "Tortellini",
    "Lasagna",
    "Buffalo Chicken Wings",
    "Tater Tots",
    "Hot Dogs",
    "Barbecue Ribs",
    "Biscuits and Gravy",
    "Meatloaf",
    "Grits",
    "Hamburger",
    "ice cream",
];

const UNAVAILABLE_DISHES_INTENT = project.unavailableDishes.map(dish => dish.toLowerCase() + '_' + '~' + 'unavailable').join('|');

const CATEGORY_ALIASES = {
    "drink" : ["drink", "refresher"],
    "pizza": ["pizza"],
    "street food": ["street food", "fast food"],
    "dessert": ["dessert"]
}

function findCategory(catAlternative) {
    for (let category in CATEGORY_ALIASES) {
        for (let key in CATEGORY_ALIASES[category]) {
            if (catAlternative.includes(CATEGORY_ALIASES[category][key])) {
                return category;
            }
        }
    }
    return;
}

function getCategoryItems(category) {
    return project.menu[category].map(item => {
        let alts = [item.title + '~' + item.id];
        if (item.alt) {
            item.alt.forEach(alternative => alts.push(alternative + '~' + item.id));
        }
        return alts;
    }).flat().join('|');
}

//TODO get categories from the menu and augment them with aliases later
project.CATEGORY_LIST = _.flatten(Object.keys(CATEGORY_ALIASES).map(category => CATEGORY_ALIASES[category].map(alt => alt + '_' + '~' + category))).join('|');

const CATEGORY_INTENT = _.flatten(Object.keys(CATEGORY_ALIASES).map(category => CATEGORY_ALIASES[category].map(alt => alt + '_' + '~' + 'category'))).join('|');

project.ID_TO_TYPES = _.reduce(project.menu, (a, p) => {
    p.forEach(i => a[i.id] = i.type);
    return a;
}, {});

project.ITEMS_INTENT = AVAILABLE_ITEMS_INTENT + '|' + UNAVAILABLE_DISHES_INTENT + '|' + CATEGORY_INTENT;

project.utils = {
    findCategory,
    getCategoryItems,
}