import { menuArray } from './data.js'

const divMenu = document.getElementById('section-menu')

const order = []

document.getElementById('btn-view-order').addEventListener('click', (e) => {
    handleViewOrder()
})

document.getElementById("btn-close-view-order").addEventListener('click', () => {
    showModal('modal-view-order', false)
})

divMenu.addEventListener('click', (e) => {
    const id = e.target.dataset.id
    if (id) handleAddItemToOrder(id)
})

const renderMenu = (category = 'coffee') => {
    divMenu.innerHTML = getMenuHTML(menuArray, category)
}

const renderOrder = (order) => {
    document.getElementById('modal-view-order-inner').innerHTML = getOrderHTML(order)

}

const getMenuHTML = (menu, category) => {
    return menu.filter(item => item.category === category).map(item => {
        return `
            <p>${item.name}</p>
            <button data-id="${item.id}">Add</button>
        `
    }).join('')
}

const getOrderHTML = (order) => {
    return order.map(item => {
        return `
            <p>${item.name}</p>
        `
    }).join('')
}

// Helper functions
const getOrderTotal = () => {}

const showModal = (modal, show) => {
    const target = document.getElementById(modal)
    show ? target.showModal() : target.close()
}

// Event handlers
const handleAddItemToOrder = (id) => {
    const item = menuArray.find(item => item.id === +id)
    order.push(item)
    renderOrder(order)
}

const handleViewOrder = () => {
    showModal('modal-view-order', true)
}

renderMenu('coffee')