// Todo 1: Fix ul scroll in modal when too many items added to list
// Todo 2: Align the minus logo in the middle of remove button, make sure it's a circle
// Todo 3: Fix the color of the ingredients lists on main page
// Todo 4: Create a selection function for the bottom row of icons (use vivid color for selection)
// Todo 5: Create star rating system
// Todo 6: Discount code

import { menuArray } from './data.js'
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

// Grab what we need from the DOM (only if we use it more than once in code)
const ulMenu = document.getElementById('ul-menu')
const ulMenuFilter = document.getElementById('ul-menu-filter')
const modalViewBasket = document.getElementById('modal-view-basket')
const modalCheckout = document.getElementById('modal-checkout')
const modalOrderComplete = document.getElementById('modal-order-complete')
const modalMyOrders = document.getElementById('modal-my-orders')
const modalDiscounts = document.getElementById('modal-discounts')
const btnCheckout = document.getElementById('btn-checkout')
const formCardDet = document.querySelectorAll('#f-card-det')[0]

// Init vars
let basket = []
let myOrders = []

// Set up event listeners
document.getElementById('btn-view-basket').addEventListener('click', () => {
    showModal(modalViewBasket, true)
})

document.getElementById('btn-close-view-basket').addEventListener('click', () => {
    showModal(modalViewBasket, false)
})

document.getElementById('b-nav-my-orders').addEventListener('click', () => {
    showModal(modalMyOrders, true)
})

document.getElementById('div-order-type').addEventListener('click', e => {
    const id = e.target.dataset.id
    if (id) handleSelectOrderType(e.target)
})

document.getElementById('b-nav-discounts').addEventListener('click', () => {
    showModal(modalDiscounts, true)
})

btnCheckout.addEventListener('click', () => {
    handleCheckout()
})

ulMenuFilter.addEventListener('click', e => {
    const filter = e.target.dataset.filter
    if (filter) handleFilterSelection(e.target, filter)
})

ulMenu.addEventListener('click', e => {
    const id = e.target.dataset.id
    if (id) handleAddItemToOrder(id)
})

modalOrderComplete.addEventListener('click', e => {
    const type = e.target.dataset.type
    if (type) handleReset()
})

modalViewBasket.addEventListener('click', e => {
    console.log(e.target.dataset.type)
    const type = e.target.dataset.type

    const handleClick = {
        checkout: () => {
            handleCheckout()
        },
        close: () => {
            showModal(modalViewBasket, false)
        },
        remove: () => {
            handleRemoveItemFromOrder(e.target.dataset.instanceId)
        },
    }

    if (type) handleClick[type]()
})

modalCheckout.addEventListener('click', e => {
    const type = e.target.dataset.type

    const handleClick = {
        pay: () => {
            if (isFormComplete(formCardDet)) handlePayment()
        },
        back: () => {
            showModal(modalCheckout, false)
            showModal(modalViewBasket, true)
        },
        close: () => {
            showModal(modalCheckout, false)
        },
    }
    
    if (type) handleClick[type]()
})

modalMyOrders.addEventListener('click', e => {
    const type = e.target.dataset.type
    if (type) showModal(modalMyOrders, false)
})

formCardDet.addEventListener('input', e => {
    const input = e.target
    console.log(input.classList)
    console.log(Boolean(input.value))
    Boolean(input.value) ? input.classList.remove('warning') : input.classList.add('warning')
})

// Render functions
const renderMenu = (menu, category = 'coffee') => {
    ulMenu.innerHTML = menu.filter(item => item.category === category).map((item, index, arr) => {
        const {name, ingredients, price, imageURL, id} = item
        const isLastIter = index + 1 === arr.length
        return `
            <li class="li-menu-item">
                <img class="img-menu-item" src="${imageURL}">
                <div>
                    <span class="span-menu-item-name">${name}</span>
                    <span class="span-menu-item-ingredients">
                        ${ingredients.map(ingredient => ingredient).join(', ')}
                    </span>
                    <span class="span-menu-item-price">£${price.toFixed(2)}</span>
                </div>
                <button class="btn-add-item" data-id="${id}">
                    <i class='bx bx-plus bx-md'></i>
                </button>
            </li>
            ${isLastIter ? '' : '<div class="d-divider d-divider-primary"></div>'}
        `
    }).join('')
}

const renderOrder = (basket) => {
    const html = basket.map((item, index, arr) => {
        // console.log(item)
        const {name, ingredients, price, imageURL, instanceId} = item
        const isLastIter = index + 1 === arr.length
        return `
            <li class="li-menu-item">
                <img class="img-menu-item" src="${imageURL}">
                <div>
                    <span class="span-menu-item-name">${name}</span>
                    <span class="span-menu-item-ingredients basket-ingredients">
                        ${ingredients.map(ingredient => ingredient).join(', ')}
                    </span>
                    <span class="span-menu-item-price basket-price">£${price.toFixed(2)}</span>
                </div>
                <button class="btn-remove-item" data-instance-id="${instanceId}" data-type="remove">
                    <i class='bx bx-minus bx-sm'></i>
                </button>
            </li>
            ${isLastIter ? '' : '<div class="d-divider d-divider-accent"></div>'}
        `
    }).join('')

    const htmlTotal = `
            <div class="d-modal-space-between">
                <p>Total:</p>
                <p id="p-basket-total">$${getOrderTotal(basket)}</p>
            </div>
            <button class="btn-modal-main" id="btn-checkout" data-type="checkout">Checkout</button>
    `
    
    document.getElementById('ul-view-basket-items').innerHTML = html
    // document.getElementById('div-view-basket-total').innerHTML = htmlTotal
    document.getElementById('span-item-count').textContent = basket.length
    document.getElementById('p-basket-total').textContent = `£${getOrderTotal(basket)}`
    document.getElementById('p-basket-total-b').textContent = `£${getOrderTotal(basket)}`
    document.getElementById('span-basket-total').textContent = `£${getOrderTotal(basket)}`
    enableButtons([btnCheckout], basket.length > 0)
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

const renderOrderComplete = (order) => {
    let html = `
        <p class="p-modal"->Your order is on it's way! Thank you for visiting. We hope to see you again.</p>
        <h4 class="h4-your-order">Your order</h4>
        
    `

    html += order.map(item => {
        return `
        <div class="d-ordered-item">
            <p>${item.name}</p><p>£${item.price.toFixed(2)}</p>
        </div>
        `
    }).join('')

    html += `
        <div class="d-divider d-divider-accent"></div>
        <div class="d-total">
            <p>Total:</p> 
            <p>£${getOrderTotal(order)}</p>
        </div>
    `
    document.getElementById('div-modal-order-complete-details').innerHTML = html
}

const renderMyOrders = (myOrders) => {
    document.getElementById('ul-my-orders').innerHTML = myOrders.map((order, index, arr) => {
        const isLastIter = index + 1 === arr.length
        return `
            <li>
                <div class="d-modal-space-between">
                        <p>${order.date}</p>
                        <p>£${order.total}</p>
                </div>
                <p>${order.items.map(item => item).join(', ')}</p>
            </li>
            ${isLastIter ? '' : '<div class="d-divider d-divider-accent"></div>'}
        `
    }).join('')
}

// EVENT HANDLERS

// Add item to order; here we are using structuredClone() to create a deep copy of
// the order item. Now we can give it a UUID without changing the menu array. UUID 
// means we can add/remove multiple instances of the same item to the order
const handleAddItemToOrder = (id) => {
    const item = menuArray.find(item => item.id === +id)
    let deepCopyOfItem = structuredClone(item)
    deepCopyOfItem.instanceId = uuidv4()
    basket.push(deepCopyOfItem)
    renderOrder(basket)
}

const handleRemoveItemFromOrder = (instanceIdToRemove) => {
    // console.log(instanceIdToRemove)
    basket = basket.reduce((arr, item) => {
        if (item.instanceId !== instanceIdToRemove) arr.push(item)
        return arr
    }, [])

    renderOrder(basket)
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
    showModal(modalViewBasket, false)
    showModal(modalCheckout, true)
}

const handlePayment = () => {
    renderOrderComplete(basket)
    formCardDet.reset()
    showModal(modalCheckout, false)
    showModal(modalOrderComplete, true)
}

const handleReset = () => {
    const pastOrderObj = {
        items: basket.map(item => item.name),
        total: getOrderTotal(basket),
        date: new Date().toLocaleDateString('en-GB', {
            month: 'short',
            day: 'numeric',
        })
    }
    myOrders.push(pastOrderObj)
    basket = []
    renderOrder(basket)
    renderMyOrders(myOrders)
    showModal(modalOrderComplete, false)
}

// Helper functions
const getOrderTotal = (order) => {
    if (order.length > 0) {
        return order.map(
            item => item.price
        ).reduce(
            (total, price) => total + price
        ).toFixed(2)
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

const showModal = (modal, show) => {
    show ? modal.showModal() : modal.close()
}

const enableButtons = (buttons, doEnable) => {
    buttons.length > 0 && buttons.forEach(button => button.disabled = !doEnable)
}

renderMenu(menuArray, 'coffee')
renderOrder(basket)
renderFilterBtns()