import { Component } from 'react'

let timer = null
const fps = 60
let speed = 40 // 蛇当前移动速度，单位像素/秒
const slowSpeed = 40 // 正常移动速度
const dejavuSpeed = slowSpeed * 2 // 加速时的速度, 速度倍数如果是非整数， 加减速时有可能会发生抖动， 
// 因为非整数时，无法完全均匀补充或删减轨迹点， 待完善
const bodyR = 20
const spacing = 25 // 每个节点的间距
const growSpeed = 3 // 成长速度，每多少分数增加一个节点
const mainWidth = 1024
const mainHeight = mainWidth * (720 / 1024)
const createFoodSpeed = 10 // 生成食物的速度，单位个/秒
const foodR = 5
const foodAmount = 200 // 食物上限

let self = null // 用于绑定组件this
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
        self = this
    }

    componentDidMount () {
        self.init()
    }

    componentWillUnmount () {
        if (timer) clearInterval(timer)
    }

    // 初始化数据
    init () {
        if (timer) clearInterval(timer)
        self.setState({
            snake: [
                // 头部是最后一个，尾部是第一个
                // cp：centerPoint
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle" },
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle" },
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle" },
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle" },
                { cpx: 200, cpy: 200, r: bodyR, collisionBoxType: "circle" },
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
            if (!self.state.pause) {
                const { trace, snake, angle } = JSON.parse(JSON.stringify({ data: self.state })).data
                let head = snake[snake.length - 1]
                const { cpx, cpy } = head
                const distance = speed / (1000 / fps)
                // 使头部向前移动一帧
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
                if (nextTrace.length > parseInt((1000 / ((speed / spacing) * fps)) * snake.length, 10)) {
                    nextTrace.pop()
                }
                self.setState({
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
        if (!self.state.pause) {
            const { left, top } = document.getElementById("main").getBoundingClientRect()
            const { scrollLeft, scrollTop } = document.documentElement
            const { pageX, pageY } = e
            const mouseX = pageX - left - scrollLeft
            const mouseY = pageY - top - scrollTop // 鼠标相对于画布左上角的坐标
            const { snake } = self.state
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
            self.setState({
                angle: angle === 360 ? 0 : angle
            })
        } else {
            if (timer) clearInterval(timer)
        }
    }

    // 直接复制尾部作为新的节点
    addNode () {
        if (!self.state.pause) {
            const { snake } = self.state
            self.setState({
                snake: [snake[0], ...self.state.snake]
            })
        } else {
            if (timer) clearInterval(timer)
        }
    }

    // 生成食物
    addFood () {
        if (!self.state.pause) {
            if (self.state.foodList.length < foodAmount) {
                if (Math.random() < createFoodSpeed / (1000 / fps)) {
                    const newFood = { cpx: Math.random() * (1024 - foodR * 2) + foodR, cpy: Math.random() * (720 - foodR * 2) + foodR, r: foodR, collisionBoxType: "circle" }
                    self.setState({
                        foodList: [...self.state.foodList, newFood]
                    })
                }
            }
        } else {
            if (timer) clearInterval(timer)
        }
    }

    // 碰撞箱检测
    collisionBoxCheck (node1, node2) {
        if (!self.state.pause) {
            const collisionBoxType1 = node1.collisionBoxType
            // 目前只有圆形碰撞箱，保留方形碰撞箱的可能
            switch (collisionBoxType1) {
                case "circle": {
                    const collisionBoxType2 = node2.collisionBoxType
                    switch (collisionBoxType2) {
                        case "circle": {
                            // 如果都是圆形，直接计算两者距离是否小于半径之和
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
        if (!self.state.pause) {
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

    // 运行流程
    async workflow () {
        await self.forward()
        self.addFood()
        let { snake, foodList, score } = self.state
        const head = snake[snake.length - 1]
        if (self.collisionWallCheck(head)) {
            self.init()
            return null
        }
        const nextFoodList = []
        foodList.forEach((food) => {
            if (self.collisionBoxCheck(head, food)) {
                score += 1
                if (score % growSpeed === 0) {
                    self.addNode()
                }
            } else {
                nextFoodList.push(food)
            }
        })
        self.setState({
            score,
            foodList: nextFoodList
        })
    }

    // 当触发暂停时，根据当前暂停状态暂停游戏或恢复游戏
    onPause () {
        if (self.state.pause) {
            timer = setInterval(self.workflow, 1000 / fps)
            self.setState({
                pause: false
            })
        } else {
            if (timer) clearInterval(timer)
            self.setState({
                pause: true
            })
            console.log(self.state)
        }
    }

    async onSpeedDown (nextSpeed) {
        return new Promise(resolve => {
            if (nextSpeed < speed) {
                console.log("SpeedDown")
                const scale = speed / nextSpeed
                const a = (scale - 1) * 10
                const b = 10 / a
                const c = b > 1 ? b - parseInt(b, 10) : 1 - b
                let no = 1
                const nextTrace = []
                // 补充轨迹点方法是，每多少个原始轨迹点后面补充多少个轨迹点， no记录每多少个轨迹点
                self.state.trace.forEach((t, index) => {
                    const random = Math.random()
                    if (no >= parseInt(b, 10)) {
                        const t2 = self.state.trace[index + 1] || t
                        const deltaX = t.cpx - t2.cpx // 计算两点的差值， 再根据需要添加的个数均分， 再计算到新增的轨迹点
                        const deltaY = t.cpy - t2.cpy
                        nextTrace.push(t)
                        let addNodeAmount = parseInt(scale - 1, 10) || 1 // 减速倍率[1,2)增加一个， 减速倍率[2,无穷)增加parseInt(scale - 1)个
                        if (c > random) {
                            addNodeAmount += 1 // 根据倍率的小数部分概率再加一个
                        }
                        for (let i = 0; i < addNodeAmount; i += 1) {
                            nextTrace.push({
                                cpx: t.cpx - deltaX / (addNodeAmount + 1) * (i + 1), // 新增多少个，则需要均分+1份
                                cpy: t.cpy - deltaY / (addNodeAmount + 1) * (i + 1)
                            })
                        }
                        no = 1
                    } else {
                        nextTrace.push(t)
                        no += 1
                    }
                })
                self.setState({
                    trace: nextTrace
                }, () => { resolve() })
            } else { resolve() }
        })
    }

    async onSpeedUp (nextSpeed) {
        return new Promise(resolve => {
            if (nextSpeed > speed) {
                console.log("SpeedUp")
                const scale = nextSpeed / speed
                let no = 0
                const nextTrace = []
                for (let i = 0; i < self.state.trace.length; i += 1) {
                    if (i >= scale * no) {
                        nextTrace.push(self.state.trace[i])
                        no += 1
                    }
                }
                self.setState({
                    trace: nextTrace
                }, () => { resolve() })
            } else { resolve() }
        })
    }

    render () {
        return <div
            id="main"
            style={{
                border: "1px solid #000",
                width: mainWidth, height: mainHeight,
                boxSizing: 'content-box',
                margin: "20px"
            }}
            tabIndex={0}// 使该div可被聚焦，<del>才能用键盘事件</del>
            onKeyPress={async (e) => {
                if (e.key === "s") {
                    if (speed === dejavuSpeed) {
                        self.onPause()
                        await self.onSpeedDown(slowSpeed)
                        speed = slowSpeed
                        self.onPause()
                    } else {
                        self.onPause()
                        await self.onSpeedUp(dejavuSpeed)
                        speed = dejavuSpeed
                        self.onPause()
                    }
                }
            }}
            onClick={self.onPause}
            onMouseMove={self.setTurnAngel}
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
                        self.state.foodList.map((node, index) => {
                            const { cpx, cpy } = node
                            return <use href="#food" transform={`translate(${cpx},${cpy})`} key={`food_${index}`} />
                        })
                    }
                </g>
                <g>
                    {
                        self.state.snake.map((node, index) => {
                            const { cpx, cpy } = node
                            return index === self.state.snake.length - 1 ?
                                <use href="#head" transform={`translate(${cpx},${cpy}),rotate(${-self.state.angle})`} key={`head`} /> :
                                <use href="#body" transform={`translate(${cpx},${cpy})`} key={`body_${index}`} />
                        })
                    }
                </g>
                {
                    self.state.pause ? <use href="#tips" /> : null
                }
            </svg>
        </div >
    }
}

export default Index
