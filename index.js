import { menuArray } from './data.js'

const divMenu = document.getElementById('section-menu')

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

const order = []

const renderMenu = () => {
    divMenu.innerHTML = getMenuHTML(menuArray)
}

const renderOrder = (order) => {

}

const getMenuHTML = (menu) => {
    return menu.map(item => {
        return `
            <p>${item.name}</p>
            <button data-id="${item.id}">Add</button>
        `
    }).join('')
}

const getOrderHTML = () => {

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
    console.log(order)
}

const handleViewOrder = () => {
    showModal('modal-view-order', true)
}

renderMenu()