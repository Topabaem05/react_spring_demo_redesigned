import { useState } from 'react'
import { useSprings, animated, to as interpolate } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'


import styles from './styles.module.css'

const cards = [
  { front: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg', back: 'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg', title: 'Card 1', description: 'This is card 1', link: ''},
  { front: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',back :'https://upload.wikimedia.org/wikipedia/commons/3/3a/TheLovers.jpg'},
  { front: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/690px-RWS_Tarot_02_High_Priestess.jpg', back : ''},
  {front : 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg', back: ''}// 'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
  // 'https://upload.wikimedia.org/wikipedia/commons/3/3a/TheLovers.jpg',
  // 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/RWS_Tarot_02_High_Priestess.jpg/690px-RWS_Tarot_02_High_Priestess.jpg',
  // 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
  // 'https://upload.wikimedia.org/wikipedia/commons/f/f2/The_Fool_with_zero%2C_from_Vergnano_Tarot_%28cropped%29.jpg',
]

// These two are just helpers, they curate spring data, values that are later being interpolated into css
const to = (i: number) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: -10 + Math.random() * 20,
  delay: i * 100,
})
const from = (_i: number) => ({ x: 0, rot: 0, scale: 1.5, y: -1000 })
// This is being used down there in the view, it interpolates rotation and scale into a css transform
const trans = (r: number, s: number) =>
  `perspective(1500px) rotateX(30deg) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`

function Deck() {
  const [gone] = useState(() => new Set()) // The set flags all the cards that are flicked out
  const [flipped, setFlipped] = useState(Array(cards.length).fill(false));
  const [props, api] = useSprings(cards.length, i => ({
    ...to(i),
    from: from(i),
  })) // Create a bunch of springs using the helpers above
  // Create a gesture, we're interested in down-state, delta (current-pos - click-pos), direction and velocity
  // 1. useDrag 훅에서 드래그 중인 방향을 확인하고 해당 방향으로만 이동하도록 설정합니다.
const bind = useDrag(({ args: [index], active, movement: [mx, my], direction: [xDir, yDir], velocity: [vx, vy] }) => {
  const triggerX = Math.abs(vx) > 0.2;
  const triggerY = Math.abs(vy) > 0.2;

  // 모든 방향으로 이동하도록 설정
  const x = mx;
  const y = my;

  if (!active && (triggerX || triggerY)) gone.add(index);

  api.start(i => {
    if (index !== i) return;

    const isGone = gone.has(index);
    const moveX = isGone ? (200 + window.innerWidth) * xDir : active ? x : 0;
    const moveY = isGone ? (200 + window.innerHeight) * yDir : active ? y : 0;

    const rotX = my / 100 + (isGone ? yDir * 10 * vy : 0);
    const rotY = mx / 100 + (isGone ? xDir * 10 * vx : 0);

    const scale = active ? 1.1 : 1;

    return {
      x: moveX,
      y: moveY,
      rotX,
      rotY,
      scale,
      delay: undefined,
      config: { friction: 50, tension: active ? 800 : isGone ? 200 : 500 },
    };
  });

  if (!active && gone.size === cards.length) {
    setTimeout(() => {
      gone.clear();
      api.start(i => to(i));
      setFlipped(Array(cards.length).fill(false));
    }, 600);
  }
});

  // Now we're just mapping the animated values to our view, that's it. Btw, this component only renders once. :-)
  return (
    <>
      {props.map(({ x, y, rot, scale }, i) => (
        <animated.div className={styles.deck} key={i} style={{ x, y }}>
          <animated.div
            {...bind(i)}
            onClick={() => setFlipped((prev) => [...prev.slice(0, i), !prev[i], ...prev.slice(i + 1)])}
            style={{
              transform: interpolate([rot, scale], trans),
              backgroundImage: `url(${flipped[i] ? cards[i].back : cards[i].front})`,
            }}
          >
            {flipped[i] && (
              <div className={styles.cardBackContent}>
                <div className={styles.titleBox}>
                  <h2>{cards[i].title}</h2>
                </div>
                <div className={styles.descriptionBox}>
                  <p>{cards[i].description}</p>
                  <a href={cards[i].link} target="_blank" rel="noopener noreferrer">Learn more</a>
                </div>
              </div>
            )}
          </animated.div>
        </animated.div>
      ))}
    </>
  )
}


export default function App() {
  return (
    <div className={`flex fill center ${styles.container}`}>
      <Deck />
    </div>
  )
}
