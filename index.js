// Todo 4: Create a selection function for the bottom row of icons (use vivid color for selection)
// Todo 5: Create star rating system
// Todo: Code comments
// Todo: Remove unused ids and classes

import { menuArray } from './data.js'
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

// Grab what we need from the DOM (only if we use it more than once in the rest of our code)
const ulMenu = document.getElementById('ul-menu')
const ulMenuFilter = document.getElementById('ul-menu-filter')
const secBasket = document.getElementById('sec-basket')
const modalBasket = document.getElementById('modal-basket')
const modalCheckout = document.getElementById('modal-checkout')
const modalOrderConfirmation = document.getElementById('modal-order-confirmation')
const modalMyOrders = document.getElementById('modal-my-orders')
const modalDiscounts = document.getElementById('modal-discounts')
const formCardDet = document.querySelectorAll('#f-card-det')[0]

// Init vars
let basket = []
let orderHistory = []
let discountMultiplier = 0
const discountCodes = {
    'JAN10': 0.9,
    'OFF20': 0.8
}

// --- EVENT LISTENERS --- // 

// Order type btns
document.getElementById('div-order-type').addEventListener('click', e => {
    const id = e.target.dataset.id
    if (id) handleSelectOrderType(e.target)
})

// Menu filter btns
ulMenuFilter.addEventListener('click', e => {
    const filter = e.target.dataset.filter
    if (filter) handleFilterSelection(e.target, filter)
})

// Menu item add btns
ulMenu.addEventListener('click', e => {
    const id = e.target.dataset.id
    if (id) handleAddItemToOrder(id)
})

// Footer nav
document.getElementById('ul-footer-nav').addEventListener('click', e => {
    const type = e.target.dataset.type

    // I use this object literal 'switch' style whenever a modal has more than one button
    const handleClick = {
        orders: () => {
            showModal(modalMyOrders, true)
        },
        discounts: () => {
            showModal(modalDiscounts, true)
        }
    }   
    if (type) handleClick[type]()
}) 

// View basket btn (via parent section element, so we can re-render btn whenever we want)
secBasket.addEventListener('click', e => {
    const type = e.target.dataset.type
    if (type === 'basket') showModal(modalBasket, true)
})

// Order confirmation modal, just a close btn (resets order system when clicked)
modalOrderConfirmation.addEventListener('click', e => {
    const type = e.target.dataset.type
    if (type === 'reset') handleReset()
})

// Basket buttons, go to checkout, remove ite, or close
modalBasket.addEventListener('click', e => {
    const type = e.target.dataset.type
    
    const handleClick = {
        checkout: () => {
            handleCheckout()
        },
        close: () => {
            showModal(modalBasket, false)
        },
        remove: () => {
            handleRemoveItemFromOrder(e.target.dataset.instanceId)
        }
    }

    if (type) handleClick[type]()
})

// Checkout buttons 1. Pay 2. Back to basket 3. Close 4. Apply discount
modalCheckout.addEventListener('click', e => {
    const type = e.target.dataset.type

    const handleClick = {
        pay: () => {
            if (isFormComplete(formCardDet)) handlePayment()
        },
        back: () => {
            showModal(modalCheckout, false)
            showModal(modalBasket, true)
        },
        close: () => {
            showModal(modalCheckout, false)
        },
        discount: () => {
            handleApplyDiscount()
        }
    }
    
    if (type) handleClick[type]()
})

// Discounts modal, just the close btn
modalDiscounts.addEventListener('click', e => {
    const type = e.target.dataset.type
    if (type === 'close') showModal(modalDiscounts, false)
})

// My Orders (order history) modal, just a close btn
modalMyOrders.addEventListener('click', e => {
    const type = e.target.dataset.type
    if (type === 'close') showModal(modalMyOrders, false)
})

// Credit card form — every time the value changes, remove warnng if a value exists, else
// add the warning class
formCardDet.addEventListener('input', e => {
    const input = e.target
    Boolean(input.value) ? input.classList.remove('warning') : input.classList.add('warning')
})

// Render functions
const renderMenu = (menu, category = 'coffee') => {
    ulMenu.innerHTML = menu.filter(item => item.category === category).map((item, index, arr) => {
        const {name, ingredients, price, imageURL, id} = item
        const isLastIter = index + 1 === arr.length
        return `
            <li class="li-menu-item">
                <img class="img-item" src="${imageURL}">
                <div>
                    <span class="spn-item-name">${name}</span>
                    <span class="spn-item-dets">
                        ${ingredients.map(ingredient => ingredient).join(', ')}
                    </span>
                    <span class="spn-item-dets">£${price.toFixed(2)}</span>
                </div>
                <button class="btn-add" data-id="${id}">
                    <i class='bx bx-plus bx-md'></i>
                </button>
            </li>
            ${isLastIter ? '' : '<div class="div-divider div-divider-primary"></div>'}
        `
    }).join('')
}

const renderBasket = basket => {

    // Generate html for items in basket
    const htmlBasket = basket.map((item, index, arr) => {
        const {name, ingredients, price, imageURL, instanceId} = item
        const isLastIter = index + 1 === arr.length
        return `
            <li class="li-menu-item">
                <img class="img-item" src="${imageURL}">
                <div>
                    <span class="spn-item-name">${name}</span>
                    <span class="spn-item-dets">
                        ${ingredients.map(ingredient => ingredient).join(', ')}
                    </span>
                    <span class="spn-item-dets">£${price.toFixed(2)}</span>
                </div>
                <button class="btn-remove" data-instance-id="${instanceId}" data-type="remove">
                    <i class='bx bx-minus bx-sm'></i>
                </button>
            </li>
            ${isLastIter ? '' : '<div class="div-divider div-divider-accent"></div>'}
        `
    }).join('')

    // Create the html for the basket total. If a discount is active, get the percentage and 
    // display it next to 'Total'. Else htmlDiscount is an empty string and displays nothing
    // const htmlDiscount = 
    const htmlTotal = `
        <p>Total ${renderDiscountStatus(discountMultiplier)}:</p>
        <p id="p-basket-total">£${getOrderTotal(basket)}</p>
    `

    // Render the basket contents, then the total amount
    document.getElementById('ul-basket-items').innerHTML = htmlBasket
    document.getElementById('div-basket-total').innerHTML = htmlTotal
    
    document.getElementById('div-checkout-total').innerHTML = htmlTotal
    enableButtons([document.getElementById('btn-checkout')], basket.length > 0)
    renderViewBasketBtn(basket)
}

const renderCheckout = basket => {

    const htmlCheckoutTotal = `
        <p>Total ${renderDiscountStatus(discountMultiplier)}:</p>
        <p id="p-basket-total">£${getOrderTotal(basket)}</p>
    `
    document.getElementById('div-checkout-total').innerHTML = htmlCheckoutTotal
}

const renderOrderConfirmation = basket => {
   
    let html = basket.map(item => {
        return `
            <div class="d-ordered-item">
                <p>${item.name}</p><p>£${item.price.toFixed(2)}</p>
            </div>
        `
    }).join('')

    html += `
        <li>
            <div class="div-divider div-divider-accent"></div>
            <div class="d-total" id="div-order-confirmed-total">
                <p>Total: ${renderDiscountStatus(discountMultiplier)}</p>
                <p>£${getOrderTotal(basket)}</p>
            </div>
        </li>
    `
    document.getElementById('u-modal-order-complete-details').innerHTML = html
}

const renderOrderHistory = orderHistory => {
    document.getElementById('ul-order-history').innerHTML = orderHistory.map((order, index, arr) => {
        const isLastIter = index + 1 === arr.length
        return `
            <li class="li-order-history">
                <div class="div-space-between">
                        <p>${order.date}</p>
                        <p>£${order.total}</p>
                </div>
                <p>${order.items.map(item => item).join(', ')}</p>
            </li>
            ${isLastIter ? '' : '<div class="div-divider div-divider-accent"></div>'}
        `
    }).join('')
}

const renderDiscounts = discountCodes => {
    const html = Object.entries(discountCodes).map((obj, index, arr) => {
        const isLastIter = index + 1 === arr.length
        const percentage = (100-(obj[1] / 1 * 100))
        return `
            <li class="li-discount-code">
                <p>Enjoy ${percentage}% off with code <span class="spn-code">${obj[0]}</span></p>
            </li>
            ${isLastIter ? '' : '<div class="div-divider div-divider-accent"></div>'}
        `
    }).join('')
    document.getElementById('ul-discounts').innerHTML = html
}

const renderViewBasketBtn = basket => {
    secBasket.innerHTML = `
        <button class="btn btn-view-basket" id="btn-view-basket" data-type="basket">
            <i class="bx bx-basket bx-lg"></i>
            <span class="span-item-count">${basket.length}</span>
            <span>View basket</span>
            <span class="span-basket-total">£${getOrderTotal(basket)}</span>
        </button>`
}

const renderFilterBtns = () => {
    const filterCategories = [...new Set(menuArray.map(item => item.category))]
    ulMenuFilter.innerHTML = filterCategories.map(category => {
        const btnTxt = category.charAt(0).toUpperCase() + category.slice(1)
        const isSelected = category === 'coffee' && 'btn-selected'
        return `
            <li class="li-menu-filter">
                <button class="btn-filter-category ${isSelected}" data-filter="${category}">${btnTxt}</button>
            </li>
        `
    }).join('')
}

// EVENT HANDLERS

// Add item to order; here we are using structuredClone() to create a deep copy of
// the order item. Now we can give it a UUID without changing the menu array. UUID 
// means we can add/remove multiple instances of the same item to the order

// This object contains all the logic to be executed when the various buttons across the
// app are called. This makes the event listeners much more readable.
const handleClick = {
    
}

const handleAddItemToOrder = (id) => {
    const item = menuArray.find(item => item.id === +id)
    let deepCopyOfItem = structuredClone(item)
    deepCopyOfItem.instanceId = uuidv4()
    basket.push(deepCopyOfItem)
    renderViewBasketBtn(basket)
}

const handleRemoveItemFromOrder = (instanceIdToRemove) => {
    // console.log(instanceIdToRemove)
    basket = basket.reduce((arr, item) => {
        if (item.instanceId !== instanceIdToRemove) arr.push(item)
        return arr
    }, [])

    renderBasket(basket)
}

const handleSelectOrderType = target => {
    document.querySelectorAll('.btn-order-type.btn-selected').forEach(el => el.classList.remove('btn-selected'))
    target.classList.add('btn-selected')
}

const handleFilterSelection = (el, filter) => {
    document.querySelectorAll('.btn-filter-category.btn-selected').forEach(el => el.classList.remove('btn-selected'))
    el.classList.add('btn-selected')
    renderMenu(menuArray, filter)
}

const handleCheckout = (order) => {
    showModal(modalBasket, false)
    showModal(modalCheckout, true)
}

const handlePayment = () => {
    // Save the order details into the orderHistory array
    const orderObj = {
        items: basket.map(item => item.name),
        total: getOrderTotal(basket),
        date: new Date().toLocaleDateString('en-GB', {
            month: 'short',
            day: 'numeric',
        })
    }
    orderHistory.push(orderObj)

    // Reset the card details form, hide checkout, show order confirmation
    formCardDet.reset()
    showModal(modalCheckout, false)
    showModal(modalOrderConfirmation, true)
}

const handleReset = () => {
    basket = []
    discountMultiplier = 0
    showModal(modalOrderConfirmation, false)
}

const handleApplyDiscount = () => {
    const iptDiscount = document.getElementById('ipt-discount')
    const code = iptDiscount.value
    if (Object.keys(discountCodes).includes(code)) {
        discountMultiplier = discountCodes[code]
        if (iptDiscount.classList.contains('warning')) iptDiscount.classList.remove('warning')
        renderCheckout(basket)
    } else {
        discountMultiplier = 0
        iptDiscount.classList.add('warning')
        renderCheckout(basket)
    }
    iptDiscount.value = ''
}

// Helper functions
const getOrderTotal = order => {
    if (order.length > 0) {
        let total = order.map(
            item => item.price
        ).reduce(
            (total, price) => total + price
        )
        if (discountMultiplier) total *= discountMultiplier
        return total.toFixed(2)
    } else {
        return "0.00"
    }
}

const isFormComplete = form => {
    const emptyInputs = [...form.elements].filter(element => !Boolean(element.value))
    if (emptyInputs.length > 0) {
        emptyInputs.forEach(input => input.classList.add('warning'))
        return false
    }
    return true
}

const renderDiscountStatus = discountMultiplier => {
    if (discountMultiplier > 0) {
        const percentDiscount = getDiscountPercentage(discountMultiplier)
        return `
            <span class="spn-discount">
                (${percentDiscount}% discount applied)
            </span>&nbsp;
        `
    }
    return ''
}

const showModal = (modal, show) => {
    // Render content to modal before displaying

    const render = {
        'modal-my-orders': () => {
            renderOrderHistory(orderHistory)
        },
        'modal-basket': () => {
            renderBasket(basket)
        },
        'modal-checkout': () => {
            renderCheckout(basket)
        },
        'modal-order-confirmation': () => {
            renderOrderConfirmation(basket)
        },
        'modal-discounts': () => {
            renderDiscounts(discountCodes)
        }
    }
    
    if (show) {
        render[modal.id]()
        modal.showModal()
    } else {
        modal.close()
    }
}

const enableButtons = (buttons, doEnable) => {
    buttons.length > 0 && buttons.forEach(button => button.disabled = !doEnable)
}

const getDiscountPercentage = discountMultiplier => {
    return (100-(discountMultiplier / 1 * 100))
}

renderMenu(menuArray, 'coffee')
renderViewBasketBtn(basket)
renderFilterBtns()