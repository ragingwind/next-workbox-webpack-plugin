import React from 'react'

export default class extends React.PureComponent {
  componentDidMount () {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('service worker registration successful')
        })
        .catch(err => {
          console.warn('service worker registration failed', err.message)
        })
    }
  }
  render () {
    return (
      <div>
        <p>Hello PWA with Next.js</p>
        <p>Check the console for the Service Worker registration status.</p>
      </div>
    )
  }
}