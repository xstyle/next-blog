import Head from 'next/head'
import fetch from 'node-fetch'
const BACKEND_URL = process.env.BACKEND
export async function getServerSideProps(context) {
  const response = await fetch(BACKEND_URL + '/api/robot')
  let robots = []

  if (response.status === 200) {
    robots = await response.json()
  }

  return {
    props: {
      robots
    }
  }
}

export default function Robots(props) {
  return <div className="container">
    <Head>
      <title>Выбор робота</title>
    </Head>
    <h1>Выберите робота</h1>
    <ul>
      {
        props.robots.map(robot =>
          <li key={robot._id}>{robot.name}</li>
        )
      }
    </ul>
  </div>
}