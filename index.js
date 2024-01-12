import { menuArray } from './data.js'
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'

// Grab what we need from the DOM (only if we use it more than once in code)
const ulMenu = document.getElementById('ul-menu')
const ulMenuFilter = document.getElementById('ul-menu-filter')
const modalViewBasket = document.getElementById('modal-view-basket')
const modalCheckout = document.getElementById('modal-checkout')
const modalOrderComplete = document.getElementById('modal-order-complete')
const modalMyOrders = document.getElementById('modal-my-orders')
const btnCheckout = document.getElementById('btn-checkout')

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

document.getElementById('btn-my-orders').addEventListener('click', () => {
    showModal(modalMyOrders, true)
})

document.getElementById('btn-close-my-orders').addEventListener('click', () => {
    showModal(modalMyOrders, false)
})

document.getElementById('div-order-type').addEventListener('click', e => {
    const id = e.target.dataset.id
    if (id) handleSelectOrderType(e.target)

})

btnCheckout.addEventListener('click', () => {
    handleCheckout()
})

modalCheckout.addEventListener('click', e => {
    const type = e.target.dataset.type

    const handleClick = {
        pay: () => {
            handlePayment()    
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
            ${isLastIter ? '' : '<div class="div-menu-item-divider"></div>'}
        `
    }).join('')
}

const renderOrder = (order) => {
    const html = order.map((item, index, arr) => {
        const {name, ingredients, price, imageURL, id} = item
        const isLastIter = index + 1 === arr.length
        return `
            <li class="li-menu-item">
                <img class="img-menu-item" src="${imageURL}">
                <div>
                    <span class="span-menu-item-name basket-name">${name}</span>
                    <span class="span-menu-item-ingredients basket-ingredients">
                        ${ingredients.map(ingredient => ingredient).join(', ')}
                    </span>
                    <span class="span-menu-item-price basket-price">£${price.toFixed(2)}</span>
                </div>
                <button class="btn-remove-item" data-id="${id}">
                    <i class='bx bx-minus bx-sm'></i>
                </button>
            </li>
            ${isLastIter ? '' : '<div class="div-modal-divider"></div>'}
        `
    }).join('')

    const htmlTotal = `
            <div class="div-modal-total">
                <p>Total:</p>
                <p>$${getOrderTotal(order)}</p>
            </div>
            <button class="btn-modal-main" id="btn-checkout" data-type="checkout">Checkout</button>
    `
    
    document.getElementById('ul-view-basket-items').innerHTML = html
    // document.getElementById('div-view-basket-total').innerHTML = htmlTotal
    document.getElementById('span-item-count').textContent = order.length
    document.getElementById('span-checkout-total').textContent = `£${getOrderTotal(order)}`
    document.getElementById('span-basket-total').textContent = `£${getOrderTotal(order)}`
    enableButtons([btnCheckout], order.length > 0)
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
        <p>Your order is on it's way!</p>
        <h3>Order details</h3>
    `

    html += order.map(item => {
        return `
            <p>${item.name} $${item.price}</p>
        `
    }).join('')

    html += `
        <p>Total: $${getOrderTotal(order)}</p>
        <p>How was your experience?</p>
        <p>⭐️ ⭐️ ⭐️ ⭐️ ⭐️</p>
    `
    document.getElementById('div-modal-order-complete-details').innerHTML = html
}

const renderMyOrders = (myOrders) => {
    document.getElementById('div-modal-my-orders-inner').innerHTML = myOrders.map(order => {
        return `
            <div>
                <div>
                    <p>
                        <span>${order.date}</span>
                        <span>$${order.total}</span>
                    </p>
                </div>
                <p>${order.items.map(item => item).join(', ')}</p>
            </div>
        `
    }).join('')
}

// HTML FUNCTIONS - maybe consolidate these into the render functions...
const getOrderHTML = (order) => {
    let html = order.map(item => {
        return `
            <p>${item.name}<button data-type="remove" data-instance-id="${item.instanceId}">Remove</button></p>
        `
    }).join('')
    
    const htmlTotal = `
        <p>Total: $${getOrderTotal(order)}</p>
    `

    html += htmlTotal
    return html   
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

const handleShowMyOrders = () => {
    showModal(modalMyOrders, true)
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

const showModal = (modal, show) => {
    show ? modal.showModal() : modal.close()
}

const enableButtons = (buttons, doEnable) => {
    buttons.length > 0 && buttons.forEach(button => button.disabled = !doEnable)
}

renderMenu(menuArray, 'coffee')
renderOrder(basket)
renderFilterBtns()