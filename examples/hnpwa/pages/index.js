import React from 'react'
import Link from 'next/link'
import 'isomorphic-unfetch'

export default class extends React.Component {
  static async getInitialProps ({query, pathname}) {
    const res = await fetch(`https://hnpwa.com/api/v0/${query.feed || 'news' }.json`)
    return {feeds: await res.json()}
  }

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
        <header>
          <nav>
            <Link href='/'><a>News</a></Link>
            <Link href='/?feed=newest'><a>Newest</a></Link>
            <Link href='/?feed=ask'><a>Ask</a></Link>
            <Link href='/?feed=show'><a>Show</a></Link>
            <Link href='/?feed=jobs'><a>Jobs</a></Link>
          </nav>
        </header>
        <ul>
          {this.props.feeds.map(f => <li key={f.id}>{f.title}</li>)}
        </ul>
        <style jsx>{`
          nav a {
            font-size: 1.2em;
            padding-left: 0.5em;
          }
        `}</style>
      </div>
    )
  }
}