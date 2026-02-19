import Link from 'next/link'

export default function Home() {
  return (
    <main className="home">
      <h1>Bubu Admin</h1>
      <p>使用 Payload CMS 维护宝宝与账号资源。</p>
      <Link href="/admin">进入后台</Link>
    </main>
  )
}
