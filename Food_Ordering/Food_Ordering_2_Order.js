// {Name: Food_Ordering}
// {Description: Food Ordering demo app for delivering food}

/*
This is a script for Food Ordering demo app for delivering food
Now there are four categories for food: drinks, pizza, street food, desserts.
*/

//////////////////////
// +add items to order
//////////////////////
const ADD_ITEMS_SENTENCE_START_ARRAY = [
    "Add",
    "I want",
    "I want to have",
    "Get me",
    "Order",
    "I'll take",
    "I will take",
    "I'd like",
    "I would like",
    "I would like to order",
    "I'll get",
    "I will get",
    "I'll have",
    "I will have",
    "Let me have",
    "Let me get",
];

const ADD_ITEMS_SENTENCE_START_INTENT = ADD_ITEMS_SENTENCE_START_ARRAY.join('|') + '|' + 'and|';

intent(
    `(${ADD_ITEMS_SENTENCE_START_INTENT}) (a|the|) $(NUMBER) $(ITEM p:ITEMS_INTENT)`,
    `(${ADD_ITEMS_SENTENCE_START_INTENT}) (a|the|) $(NUMBER) $(ITEM p:ITEMS_INTENT) and (a|the|) $(NUMBER) $(ITEM p:ITEMS_INTENT)`,
    `(${ADD_ITEMS_SENTENCE_START_INTENT}) (a|the|) $(NUMBER) $(ITEM p:ITEMS_INTENT) and (a|the|) $(ITEM p:ITEMS_INTENT)`,
    `(${ADD_ITEMS_SENTENCE_START_INTENT}) (a|the|some|) $(ITEM p:ITEMS_INTENT) and (a|the|) $(ITEM p:ITEMS_INTENT|)`,
    `(${ADD_ITEMS_SENTENCE_START_INTENT}) (a|the|some|) $(ITEM p:ITEMS_INTENT)`,
    p => {
        addItems(p, p.ITEM_, 0);
    }
);

intent(
    `(${ADD_ITEMS_SENTENCE_START_INTENT}) (a|the|some|) $(ITEM p:ITEMS_INTENT) and (a|the|) $(NUMBER) $(ITEM p:ITEMS_INTENT)`,
    p => addItems(p, p.ITEM_, 1)
);

intent(
    `(${ADD_ITEMS_SENTENCE_START_INTENT}) (another|) $(NUMBER) more`,
    `(${ADD_ITEMS_SENTENCE_START_INTENT}) another (one|)`,
    p => {
        if (p.state.lastId && p.state.lastName) {
            let number = p.NUMBER && p.NUMBER.number > 0 ? Math.ceil(p.NUMBER.number) : 1;
            if (number > 99) {
                number = 1;
                p.play({command: 'addToCart', item: p.state.lastId, quantity: number});
                p.play(`(Sorry,|) we don't have that many ${p.state.lastName}. (So I've added|Will add) ${number} more.`);
            } else {
                p.play({command: 'addToCart', item: p.state.lastId, quantity: number});
                p.play(
                    `Added another ${number == 1 ? '' : number} ${p.state.lastName}`,
                    `Added ${number} more ${p.state.lastName}`
                );
            }
        } else {
            p.play("(Sorry,|) You should order something first.");
        }
    }
);

let ctxClarifyCategoryItem = context(() => {
    //TODO handle numbers and multiple items
    intent(
        `(${ADD_ITEMS_SENTENCE_START_INTENT}) $(ITEM u:clarifyCategoryItems)`,
        `(${ADD_ITEMS_SENTENCE_START_INTENT}) $(NUMBER) $(ITEM u:clarifyCategoryItems)`,
        p => {
            return p.resolve(p.ITEM);
        }
    );

    intent(
        "(No|nope|stop|back|go back|return)",
        "(It is|) (not valid|invalid|not correct)",
        `(I|) (don't|do not) want $(CAT u:clarifyCategory|)`,
        p => {
            p.play(`OK, I will not add any ${p.userData.clarifyCategory.en} to your order.`);
            p.resolve(null);
        }
    );

    fallback(p => {
        p.play(`What ${p.userData.clarifyCategory.en ? p.userData.clarifyCategory.en : ""} would you like?`);
    });
});

async function addItems(p, items, shift) {
    let answer = "";
    let foundItemsCounter = 0;
    let lastId, lastName;
    for (let i = 0; i < items.length; i++) {
        let id, name;
        let number = p.NUMBER_ && p.NUMBER_[i - shift] ? Math.ceil(p.NUMBER_[i - shift].number) : 1;
        if (items[i].value && items[i].label) {
            name = items[i].value.toLowerCase();
            switch (items[i].label) {
                case 'unavailable':
                    p.play(`(Sorry,|) ${items[i].value} is not on the menu.`);
                    break;
                case 'category':
                    let category = project.utils.findCategory(name);
                    let pluralizedName = name.endsWith('s') ? name : name + "s";
                    p.play({command: 'navigation', route: `/menu/${category}`});
                    p.play(`(We have|There are) (a few|different|several) (types of|) ${pluralizedName} (for every taste|to choose from|on our menu):`);
                    for (let i = 0; i < project.menu[category].length; i++) {
                        p.play({command: 'highlight', id: project.menu[category][i].id});
                        p.play((i === project.menu[category].length - 1 ? "and " : "") + project.menu[category][i].title);
                    }
                    p.play({command: 'highlight', id: ''});
                    p.play(`Which ${pluralizedName} would you like?`);
                    p.userData.clarifyCategory.en = category;
                    p.userData.clarifyCategoryItems.en = project.utils.getCategoryItems(category);
                    let clarifiedItem = await p.then(ctxClarifyCategoryItem);
                    p.userData.clarifyCategory.en = "";
                    p.userData.clarifyCategoryItems.en = "";
                    if (clarifiedItem){
                        let clarifiedName = clarifiedItem.value.toLowerCase();
                        id = clarifiedItem.label;
                        foundItemsCounter++;
                        if (number > 99) {
                            number = 1;
                            p.play(`(Sorry,|) we don't have that many ${items[i].value}. (So I've added|Will add) ${number} instead.`);
                        }
                        p.play({command: 'addToCart', item: id, quantity: number});
                        answer += foundItemsCounter > 1 ? " and " : "Added ";
                        answer += `${number == 1 ? '' : number} ${clarifiedName} `;
                        if (project.ID_TO_TYPES[id] === "pizza" && !name.includes("pizza")) {
                            answer += number > 1 ? "pizzas " : "pizza ";
                        }
                        lastId = id;
                        lastName = clarifiedName;
                    }
                    break;
                default:
                    id = items[i].label;
                    foundItemsCounter++;
                    if (number > 99) {
                        number = 1;
                        p.play(`(Sorry,|) we don't have that many ${items[i].value}. (So I've added|Will add) ${number} instead.`);
                    }
                    p.play({command: 'addToCart', item: id, quantity: number});
                    answer += foundItemsCounter > 1 ? " and " : "Added ";
                    answer += `${number == 1 ? '' : number} ${items[i].value} `;
                    if (project.ID_TO_TYPES[id] === "pizza" && !name.includes("pizza")) {
                        answer += number > 1 ? "pizzas " : "pizza ";
                    }
                    lastId = id;
                    lastName = name;
            }
        }
    }
    if (answer !== "") {
        answer += "to your order.";
        p.state.lastId = lastId;
        p.state.lastName = lastName;
        p.play({command: 'navigation', route: '/cart'});
        p.play(answer);
    }
}
//////////////////////
// -add items to order
//////////////////////

////////////////
// +add category
////////////////
intent(
    "What (kind of|) $(CAT p:CATEGORY_LIST) do you have",
    "What (kind|kinds) of $(CAT p:CATEGORY_LIST)",
    "Do you have (any|any of the|) $(CAT p:CATEGORY_LIST)",
    "I would like some $(CAT p:CATEGORY_LIST)",
    "I (would like|want) (something|) $(TO to) $(CAT drink~drink)",
    `(${ADD_ITEMS_SENTENCE_START_INTENT}) $(NUMBER) $(CAT p:CATEGORY_LIST)`,
    `(${ADD_ITEMS_SENTENCE_START_INTENT}) $(CAT p:CATEGORY_LIST)`,
    async p => {
        let category = p.CAT.label;
        let pluralizedName = p.CAT.value.endsWith('s') ? p.CAT.value : p.CAT.value + "s";
        p.play({command: 'navigation', route: `/menu/${category}`});
        p.play(`(We have|There are) (a few|different|several) (types of|) ${pluralizedName} (for every taste|to choose from|on our menu):`);
        for (let i = 0; i < project.menu[category].length; i++) {
            p.play({command: 'highlight', id: project.menu[category][i].id});
            p.play((i === project.menu[category].length - 1 ? "and " : "") + project.menu[category][i].title);
        }
        p.play({command: 'highlight', id: ''});
        p.play(`Which ${pluralizedName} would you like?`);
        if (p.NUMBER) {
            p.userData.clarifyCategory.en = category;
            p.userData.clarifyCategoryItems.en = project.utils.getCategoryItems(category);
            let product = await p.then(ctxClarifyCategoryItem);
            p.userData.clarifyCategory.en = "";
            p.userData.clarifyCategoryItems.en = "";
            if (product) {
                let items = [product];
                addItems(p, items, 0);
            }
        }
    }
);
////////////////
// -add category
////////////////

/////////////////
// +replace items
/////////////////
intent("(Change|Replace) (one of|) (the|) $(ITEM p:ITEMS_INTENT) (to|by|with) (a|) $(ITEM p:ITEMS_INTENT)", p => {
    if (p.ITEM_ && p.ITEM_.length !== 2) {
        p.play("Please name an item to replace and an item to be added instead");
        return;
    }
    let delId, addId;
    switch (p.ITEM_[0].label) {
        case 'unavailable':
            p.play(`(Sorry,|) ${p.ITEM_[0].value} is not on the menu`);
            return;
        case 'category':
            p.play(`You will need to specify an exact ${p.ITEM_[0].value}.`);
            return;
        default:
            delId = p.ITEM_[0].label;
    }
    switch (p.ITEM_[1].label) {
        case 'unavailable':
            p.play(`(Sorry,|) ${p.ITEM_[1].value} is not on the menu`);
            return;
        case 'category':
            p.play(`You will need to specify an exact ${p.ITEM_[1].value}.`);
            return;
        default:
            addId = p.ITEM_[1].label;
    }
    let delName = p.ITEM_[0].value.toLowerCase();
    let addName = p.ITEM_[1].value.toLowerCase();
    p.state.lastId = addId;
    p.state.lastName = addName;
    let delNumber = p.NUMBER_ && p.NUMBER_[0] ? p.NUMBER_[0].number : 1;
    let number_add = p.NUMBER_ && p.NUMBER_[1] ? p.NUMBER_[1].number : 1;
    let postfix_add = "";
    let postfix_del = "";
    if (project.ID_TO_TYPES[addId] === "pizza" && !addName.includes("pizza")) {
        postfix_add = number_add > 1 ? "pizzas" : "pizza";
    }
    if (project.ID_TO_TYPES[delId] === "pizza" && !delName.includes("pizza")) {
        postfix_del = delNumber > 1 ? "pizzas" : "pizza";
    }
    let ans = '';
    let order = p.visual.order || {};
    if (!order[delId]) {
        ans = `${p.ITEM_[0].value} has not been ordered yet, `;
    } else {
        p.play({command: 'removeFromCart', item: delId, quantity: delNumber});
        ans = `Removed ${delNumber == 1 ? '' : delNumber} ${p.ITEM_[0].value} ${postfix_del} and `;
    }
    p.play({command: 'addToCart', item: addId, quantity: number_add});
    p.play(ans + ` added ${number_add == 1 ? '' : number_add} ${p.ITEM_[1].value} ${postfix_add}.`);
    p.play({command: 'navigation', route: '/cart'});
});
/////////////////
// -replace items
/////////////////

/////////////////
// +remove items
/////////////////
intent(
    "(Remove|delete|exclude) $(ITEM p:ITEMS_INTENT) (from my order|from the order|from the list|)",
    "(Remove|delete|exclude) $(NUMBER) $(ITEM p:ITEMS_INTENT) (from my order|from the order|from the list|)",
    p => {
        let order = p.visual.order || {};
        let id;
        switch (p.ITEM.label) {
            case 'unavailable':
                p.play(`(Sorry,|) ${p.ITEM_[0].value} is not on the menu`);
                return;
            case 'category':
                p.play(`You will need to specify an exact ${p.ITEM_[0].value}.`);
                return;
            default:
                id = p.ITEM.label;
        }
        if (!order[id]) {
            p.play(`${p.ITEM.value} has not been ordered yet`);
        } else {
            let quantity = order[id] ? order[id].quantity : 0;
            let deteleQnty = p.NUMBER ? Math.ceil(p.NUMBER.number) : quantity;
            p.play({command: 'removeFromCart', item: id, quantity: deteleQnty});
            p.play({command: 'navigation', route: '/cart'});
            if (quantity - deteleQnty <= 0) {
                p.play('Removed all ' + p.ITEM.value);
            } else {
                p.play(`Updated ${p.ITEM.value} quantity to ${quantity - deteleQnty}`);
            }
        }
    }
);

intent(
    "(clear|remove|empty|cancel) (everything|all items|) (from|) (the|my|) (order|cart)",
    "(remove|delete|undo) (everything|all items|my order)",
    p => {
        p.play({command: 'clearOrder', route: 'cleared-order'});
        p.play("Your order has been canceled");
    }
);
/////////////////
// -remove items
/////////////////

/////////////////
// +order details
/////////////////
intent(
    "What (is|are|do I have) (in|) (the cart|my order|order details|details)",
    "What (have|did) I (order|add|ordered|added|put) (to the cart|)?",
    p => {
        let order = p.visual.order;
        if (_.isEmpty(order)) {
            p.play(
                "You have not ordered anything yet.",
                "Your cart is empty."
            );
            return;
        }
        p.play("You have ordered:");
        for (let product in order) {
            if (order.hasOwnProperty(product)) {
                p.play(" " + order[product].quantity + " " + order[product].title);
            }
        }
    });

intent(
    "What is the total (price|amount|) (of the order|for my order|)",
    "How much (is my order|do I owe|should I pay)",
    p => {
        if (p.visual.total && p.visual.total > 0) {
            p.play("The total amount for your order is:");
            if (p.visual.route === '/cart') {
                p.play({command: 'highlight', id: 'total'});
            }
            p.play(`${p.visual.total} dollars`);
        } else {
            p.play("Your cart is empty, please make an order first.")
        }
    }
);

intent(
    "(How much|What) does (the|) $(ITEM p:ITEMS_INTENT) cost",
    "(How much is|What is the price of) (the|) $(ITEM p:ITEMS_INTENT)",
    p => {
        switch (p.ITEM.label) {
            case 'unavailable':
                p.play(`(Sorry,|) I don't know the price of ${p.ITEM.value}`);
                break;
            case 'category':
                p.play(`(Sorry,|) I don't know the generic price of the ${p.ITEM.value}. Please specify a dish.`);
                break;
            default:
                let price = project.AVAILABLE_ITEMS_BY_ID[p.ITEM.label].price;
                let s = price !== 1 ? "s" : "";
                p.play(`${p.ITEM.value} (costs|is) ${price} dollar${s}`);
        }
    }
);
/////////////////
// -order details
/////////////////