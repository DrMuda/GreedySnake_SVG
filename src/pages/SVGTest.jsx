import { Component } from 'react'

let timer = null
const fps = 60
let speed = 40
const bodyR = 20
const spacing = 25
const mainWidth = 1024
const mainHeight = mainWidth * (720 / 1024)
const createFoodSpeed = 10
const foodR = 5
const foodAmount = 200
class Index extends Component {
    constructor(props) {
        super(props);
        this.state = {
            snake: [],
            angle: 0,
            trace: [],
            foodList: [],
            pause: true,
            score: 0
        }
        this.setTurnAngel = this.setTurnAngel.bind(this)
        this.addNode = this.addNode.bind(this)
        this.forward = this.forward.bind(this)
        this.addFood = this.addFood.bind(this)
        this.onPause = this.onPause.bind(this)
        this.collisionWallCheck = this.collisionWallCheck.bind(this)
        this.init = this.init.bind(this)
    }

    componentDidMount () {
        this.init()
    }

    componentWillUnmount () {
        if (timer) clearInterval(timer)
    }

    // 初始化数据
    init () {
        if (timer) clearInterval(timer)
        this.setState({
            snake: [
                // 头部是最后一个，尾部是第一个
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle", preDistance: spacing, trace: [] },
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle", preDistance: spacing, trace: [] },
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle", preDistance: spacing, trace: [] },
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle", preDistance: spacing, trace: [] },
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle", preDistance: spacing, trace: [] },
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle" }
            ],
            angle: 0,
            trace: [],
            foodList: [],
            pause: true
        })
    }

    // 前进
    forward () {
        // 通过promise，等待setState操作完成再进行其余操作，解决出现断尾的情况
        new Promise(resolve => {
            if (!this.state.pause) {
                const { trace, snake, angle } = JSON.parse(JSON.stringify({ data: this.state })).data
                let head = snake[snake.length - 1]
                const { cpx, cpy } = head
                const distance = speed / (1000 / fps)
                // 使头部向前移动一帧，并记录到追踪数组
                if (angle === 0) {
                    head = { cpx: cpx + distance, cpy: cpy }
                } else if (angle === 90) {
                    head = { cpx: cpx, cpy: cpy - distance }
                } else if (angle === 180) {
                    head = { cpx: cpx - distance, cpy: cpy }
                } else if (angle === 270) {
                    head = { cpx: cpx, cpy: cpy + distance }
                } else {
                    const dx = Math.abs(Math.cos(angle / (180 / Math.PI)) * distance)
                    const dy = Math.abs(Math.sin(angle / (180 / Math.PI)) * distance)
                    if (angle < 90) {
                        head = { cpx: cpx + dx, cpy: cpy - dy }
                    } else if (angle < 180) {
                        head = { cpx: cpx - dx, cpy: cpy - dy }
                    } else if (angle < 270) {
                        head = { cpx: cpx - dx, cpy: cpy + dy }
                    } else {
                        head = { cpx: cpx + dx, cpy: cpy + dy }
                    }
                }
                let nextTrace = [head, ...trace]
                for (let i = 0; i < snake.length; i += 1) {
                    // 根据帧率、速度、间距为每个节点赋值对应的追踪节点
                    // 速度speed与spacing间距的比例越大，则应取越靠后的追踪节点
                    // 如果没有当前对应的追踪节点，则不做修改
                    const no = parseInt((1000 / ((speed / spacing) * fps)) * i, 10)
                    if (nextTrace[no]) {
                        snake[snake.length - (i + 1)] = { ...nextTrace[no], r: bodyR, collisionBoxType: "circle" }
                    }
                }
                // 动态设置追踪数组上限
                if (nextTrace.length > parseInt((1000 / ((speed / spacing) * fps)) * (snake.length + 1), 10)) {
                    nextTrace.pop()
                }
                this.setState({
                    trace: nextTrace,
                    snake
                }, () => {
                    resolve()
                })
            } else {
                if (timer) clearInterval(timer)
            }
            resolve()
        })
    }

    // 根据鼠标位置设置头部转向角度
    setTurnAngel (e) {
        if (!this.state.pause) {
            const { left, top } = document.getElementById("main").getBoundingClientRect()
            const { scrollLeft, scrollTop } = document.documentElement
            const { pageX, pageY } = e
            const mouseX = pageX - left - scrollLeft
            const mouseY = pageY - top - scrollTop // 鼠标相对于画布左上角的坐标
            const { snake } = this.state
            let { cpx, cpy } = snake[snake.length - 1]
            cpx = cpx * (mainWidth / 1024)
            cpy = cpy * (mainHeight / 720) // 经过缩放后的真实坐标
            const deltaX = mouseX - cpx
            const deltaY = mouseY - cpy
            let angle = 0
            if (deltaX === 0) {
                if (deltaY > 0) { angle = 270 }
                else { angle = 90 }
            } else if (deltaY === 0) {
                if (deltaX > 0) { angle = 0 }
                else { angle = 180 }
            } else {
                if (deltaX > 0 && deltaY < 0) {
                    angle = Math.abs((180 / Math.PI) * Math.atan(deltaY / deltaX))
                } else if (deltaX < 0 && deltaY < 0) {
                    angle = 180 - Math.abs((180 / Math.PI) * Math.atan(deltaY / deltaX))
                } else if (deltaX < 0 && deltaY > 0) {
                    angle = Math.abs((180 / Math.PI) * Math.atan(deltaY / deltaX)) + 180
                } else if (deltaX > 0 && deltaY > 0) {
                    angle = 360 - Math.abs((180 / Math.PI) * Math.atan(deltaY / deltaX))
                }
            }
            this.setState({
                angle: angle === 360 ? 0 : angle
            })
        } else {
            if (timer) clearInterval(timer)
        }
    }

    // 直接复制尾部作为新的节点
    addNode () {
        if (!this.state.pause) {
            const { snake } = this.state
            this.setState({
                snake: [snake[0], ...this.state.snake]
            })
        } else {
            if (timer) clearInterval(timer)
        }
    }

    // 生成食物
    addFood () {
        if (!this.state.pause) {
            if (this.state.foodList.length < foodAmount) {
                if (Math.random() < createFoodSpeed / (1000 / fps)) {
                    const newFood = { cpx: Math.random() * (1024 - foodR * 2) + foodR, cpy: Math.random() * (720 - foodR * 2) + foodR, r: foodR, collisionBoxType: "circle" }
                    this.setState({
                        foodList: [...this.state.foodList, newFood]
                    })
                }
            }
        } else {
            if (timer) clearInterval(timer)
        }
    }

    collisionBoxCheck (node1, node2) {
        if (!this.state.pause) {
            const collisionBoxType1 = node1.collisionBoxType
            switch (collisionBoxType1) {
                case "circle": {
                    const collisionBoxType2 = node2.collisionBoxType
                    switch (collisionBoxType2) {
                        case "circle": {
                            const cpx1 = node1.cpx
                            const cpy1 = node1.cpy
                            const r1 = node1.r

                            const cpx2 = node2.cpx
                            const cpy2 = node2.cpy
                            const r2 = node2.r

                            const xPow = Math.pow(cpx1 - cpx2, 2)
                            const yPow = Math.pow(cpy1 - cpy2, 2)
                            const zPow = Math.pow(r1 + r2, 2)

                            if ((xPow + yPow) < zPow) {
                                return true
                            }
                            return false
                        }
                        default: {
                            return false
                        }
                    }
                }
                default: {
                    return false
                }
            }
        } else {
            if (timer) clearInterval(timer)
        }
    }

    // 撞墙检测
    collisionWallCheck (node) {
        if (!this.state.pause) {
            const { collisionBoxType } = node
            switch (collisionBoxType) {
                case "circle": {
                    const { cpx, cpy, r } = node
                    if (cpx < 0 + r || cpx > 1024 - r || cpy < 0 + r || cpy > 720 - r) {
                        return true
                    }
                    return false
                }
                default: {
                    return false
                }
            }
        } else {
            if (timer) clearInterval(timer)
        }
    }

    // 当触发暂停时，根据当前暂停状态暂停游戏或恢复游戏
    onPause () {
        if (this.state.pause) {
            timer = setInterval(async () => {
                await this.forward()
                this.addFood()
                let { snake, foodList, score } = this.state
                const head = snake[snake.length - 1]
                if (this.collisionWallCheck(head)) {
                    this.init()
                    return null
                }
                const nextFoodList = []
                foodList.forEach((food) => {
                    if (this.collisionBoxCheck(head, food)) {
                        score += 1
                        if (score % 5 === 0) {
                            this.addNode()
                        }
                    } else {
                        nextFoodList.push(food)
                    }
                })
                this.setState({
                    score,
                    foodList: nextFoodList
                })
            }, 1000 / fps)
            this.setState({
                pause: false
            })
        } else {
            if (timer) clearInterval(timer)
            this.setState({
                pause: true
            })
            console.log(this.state)
        }
    }

    render () {
        return <div
            id="main"
            style={{
                border: "1px solid #000",
                width: mainWidth, height: mainHeight,
                boxSizing: 'content-box'
            }}
            tabIndex={0}// 使该div可被聚焦，<del>才能用键盘事件</del>
            // onKeyDown={(e) => {
            //     if (e.key === "s") {
            //         speed = 60
            //     }
            // }}
            // onKeyUp={(e) => {
            //     if (e.key === "s") {
            //         speed = 40
            //     }
            // }}
            onClick={this.onPause}
            onMouseMove={this.setTurnAngel}
        >
            <svg viewBox="0 0 1024 720" width="100%" height="100%">
                <defs>
                    <g id="head" transform={`translate(-${bodyR},-${bodyR})`}>
                        <circle r={bodyR} cx={bodyR} cy={bodyR} fill="#1890ff" stroke="#002766" />
                        <circle r={bodyR * 0.1} cx={bodyR * 1.5} cy={bodyR * 0.6} fill="black" />
                        <circle r={bodyR * 0.1} cx={bodyR * 1.5} cy={bodyR * 1.4} fill="black" />
                        <path
                            d={`
                            M ${bodyR * 1.7} ${bodyR - bodyR * 0.5 * (1 / 2)},
                            A ${bodyR * 0.5} ${bodyR * 0.5} 0 0 1 ${bodyR * 1.7} ${bodyR + bodyR * 0.5 * (1 / 2)}
                        `}
                            fill="none"
                            strokeWidth={bodyR * 0.1}
                            stroke="#000"
                        />
                    </g>
                    <g id="body" transform={`translate(-${bodyR},-${bodyR})`}>
                        <circle r={bodyR} cx={bodyR} cy={bodyR} fill="#69c0ff" stroke="#003a8c" />
                    </g>
                    <g id="food">
                        <circle r={foodR} cx={foodR} cy={foodR} fill="#1890ff" stroke="#002766" />
                    </g>
                    <g id="tips">
                        <text x={1024 / 2} y={720 / 2} textAnchor="middle" fontSize={20} fill="#000" opacity={0.5}>点击恢复/暂停游戏</text>
                    </g>
                </defs>
                <g>
                    {
                        this.state.foodList.map((node, index) => {
                            const { cpx, cpy } = node
                            return <use href="#food" transform={`translate(${cpx},${cpy})`} key={`food_${index}`} />
                        })
                    }
                </g>
                <g>
                    {
                        this.state.snake.map((node, index) => {
                            const { cpx, cpy } = node
                            return index === this.state.snake.length - 1 ?
                                <use href="#head" transform={`translate(${cpx},${cpy}),rotate(${-this.state.angle})`} key={`head`} /> :
                                <use href="#body" transform={`translate(${cpx},${cpy})`} key={`body_${index}`} />
                        })
                    }
                </g>
                {
                    this.state.pause ? <use href="#tips" /> : null
                }
            </svg>
        </div >
    }
}

export default Index
