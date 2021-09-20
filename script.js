const difficulty = (() => {
    const levels = {
        normal: {color: "#026200"},
        hard: {color: "#868817"},
        impossible: {color: "#9a2e2e"}
    }
    const bar = document.querySelector(".difficulty");
    bar.querySelectorAll(".difficulty-level").forEach(level => {
        levels[level.dataset.level].node = level;
    });
    let currentLevel;
    let enabled = false;
    setLevel(levels.normal);
    toggle();
    
    function setLevel(level) {
        if (currentLevel) {
            currentLevel.node.style.backgroundColor = "transparent";
            currentLevel.node.textContent = "";
            currentLevel.node.classList.remove("active");
        }
        currentLevel = level;
        currentLevel.node.style.backgroundColor = level.color;
        currentLevel.node.classList.add("active");
        currentLevel.node.textContent = level.node.dataset.level;
    }

    function toggle() {
        // Disables or enables setting difficulty.
        if (enabled) {
            bar.removeEventListener("click", clickHandler);
            bar.style.cursor = "default";
        } else {
            bar.addEventListener("click", clickHandler);
            bar.style.cursor = "pointer";
        }
        enabled = !enabled;
    }

    function clickHandler(e) {
        const currentLevelName = currentLevel.node.dataset.level;
        const levelNames = Object.keys(levels);
        let nextLevel
        for (let i = 0; i < levelNames.length; i++) {
            if (levelNames[i] === currentLevelName && (i < levelNames.length - 1)) {
                nextLevel = levelNames[i + 1];
                break;
            }
        }
        setLevel(levels[nextLevel ? nextLevel : "normal"]);
    }
    
    function get() {
        const name = currentLevel.node.dataset.level;
        const color = currentLevel.color;
        return {name, color};
    }

    return {toggle, get};
})();



const board = (() => {
    const boardNode = document.getElementById("board");
    boardNode.addEventListener("click", clickHandler);
    let enabled = true;
    let state = new Array(9).fill(null);
    const tiles = Array.from(boardNode.querySelectorAll(".tile"));
    const sides = (() => {
        const sidesNodes = boardNode.querySelectorAll(".side");
        let selected;
        function select(side) {
            if (!side.classList.contains("pressed")) {
                sidesNodes.forEach(node => node.classList.remove("pressed"));
                side.classList.add("pressed");
                selected = side.textContent;
            }
        }
        function toggle() {
            sidesNodes.forEach(node => node.classList.toggle("hidden"));
        }
        function getSelected() {
            if (!selected) {
                sidesNodes.forEach(node => {
                    if (node.classList.contains("pressed")) selected = node.textContent;
                });
            }
            return selected;
        }
        return ({select, toggle, getSelected});    
    })();

    function toggle(e) {
        if (enabled) boardNode.removeEventListener("click", clickHandler);
        else boardNode.addEventListener("click", clickHandler);
        enabled = !enabled;
    }

    function clickHandler(e) {
        if (!enabled) console.log("test");
        if (e.target.classList.contains("side")) sides.select(e.target);
        else if(e.target.classList.contains("tile")) {
            game.play(e.target.dataset.id);
        }
    }

    function selectTile(id, side, color) {
        if (state[id]) return false;
        state[id] = side;
        tiles[id].textContent = side;
        tiles[id].style.backgroundColor = "var(--bg-active)";
        tiles[id].style.cursor = "default";
        if (color) tiles[id].style.color = color;
        // Draw border.
        const borderStyle = "3px solid var(--border)";
        tiles.forEach((tile, id) => {
            if (state[id]) {
                // Left border.
                if (id % 3 === 0) tile.style.borderLeft = borderStyle;
                else !state[id - 1] ? 
                        tile.style.borderLeft = borderStyle : 
                        tile.style.borderLeft = "none";
                // Top border.
                if (id < 3) tile.style.borderTop = borderStyle;
                else !state[id - 3] ?
                        tile.style.borderTop = borderStyle :
                        tile.style.borderTop = "none";
            }
        });
        return true;
    }

    function getDuplicateTilesLines(duplicateNumber) {
        // Returns lines array with the same (duplicateNumber) tiles in line.
        const matchingLines = [];
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], 
                       [1, 4, 7], [2, 5, 8], [0, 4, 8], [6, 4, 2]];
        lines.forEach(line => {
            if (line.filter(id => state[id] === "X").length === duplicateNumber ||
                line.filter(id => state[id] === "O").length === duplicateNumber)
                matchingLines.push(line);
        });
        return matchingLines;
    }
    
    function getState() { return state; }

    function clear() {
        state = new Array(9).fill(null);
        tiles.forEach((tile, id) => {
            tile.textContent = "";
            tile.style.backgroundColor = "rgb(var(--main-bg-color))";
            tile.style.cursor = "pointer";
            id < 3 ? 
                tile.style.borderTop = "1px solid var(--border)" :
                tile.style.borderTop = "none";
            id % 3 === 0 ?
                tile.style.borderLeft = "1px solid var(--border)" :
                tile.style.borderLeft = "none";
        })
    }

    return {
        toggleSides: sides.toggle, 
        getSelectedSide: sides.getSelected, 
        selectTile,
        getState,
        getDuplicateTilesLines,
        toggle,
        clear
    };
})();



const game = (() => {
    let playing = false;
    let player, computer;
    let turn = "player";

    function play(id) {
        if (!playing) {
            difficulty.toggle();
            board.toggleSides();
            playing = true;
            player = Player(board.getSelectedSide());
            computer = Player(player.getSide() === "X" ? "O" : "X");
        }
        move(id);
    }

    function move(id) {
        if (turn === "player" && player.move(id)) {
            turn = "computer";
        } else if (turn === "computer") {
            computer.move();
            turn = "player";
        }
        let result = isGameOver();
        if (result) return end(result);
        if (turn === "computer") move();
    }

    function isGameOver() {
        const winLine = board.getDuplicateTilesLines(3);
        if (winLine.length) {
            const side = board.getState()[winLine[0][0]];
            return side === player.getSide() ? "player" : "computer";
        } else if (!board.getState().includes(null)) return "draw";
    }

    function end(result) {
        board.toggle();
        playing = false;
        let message;
        if (result === "player") 
            message = `&#127881 Congratulations &#127881 you win on ` +
                      `${difficulty.get().name} level!`;
        else if (result === "computer")
            message = `You lose on ${difficulty.get().name} level! ` + 
                      `Try again, practice makes perfect!`;
        else if (result === "draw")
            message = `It's a draw on ${difficulty.get().name} level! ` +
                      `That wasn't so easy, huh?`;
        summary.show(message);
    }

    function restart() {
        if (playing) return;
        difficulty.toggle();
        board.clear();
        board.toggleSides();
        board.toggle();
        turn = "player";
    }
    
    return {play, restart};
})();



const Player = (side) => {
    const getSide = () => side;
    
    function move(id) {
        // Player move.
        if (id) return board.selectTile(id, side, "var(--main-color)");

        // Computer move.
        // If normal level make a random move.
        // If hard level make either random or ai move.
        // If impossible level make ai move.
        const state = board.getState();
        const level = difficulty.get();
        if (level.name === "normal") 
            return board.selectTile(randomMove(), side, level.color);
        else if (level.name === "hard") {
            let selectedTile = Math.random() > 0.4 ? aiMove() : randomMove();
            return board.selectTile(selectedTile, side, level.color);
        } else return board.selectTile(aiMove(), side, level.color);

        function randomMove() {
            const emptyIds = [];
            state.forEach((tile, id) => {if (!tile) emptyIds.push(id)});
            return emptyIds[Math.floor(Math.random() * emptyIds.length)];
        }
        
        function aiMove() {
            let selectedTile;
            // Check finishing or defensive moves.
            const lines = board.getDuplicateTilesLines(2);
            selectedTile = lines.reduce((tile, lineIDs) => {
                let line = lineIDs.map(id => state[id]);
                if (line.includes(null) && (!tile || line.includes(side))) 
                    return lineIDs[line.indexOf(null)];
                return tile;
            }, null);
            if (selectedTile || selectedTile === 0) return selectedTile;

            // Select middle first then corners, else first tile available.
            if (!state[4]) return 4;
            selectedTile = [0, 2, 6, 8].find(id => !state[id]);
            if (selectedTile || selectedTile === 0) return selectedTile;
            return [1, 3, 5, 7].find(id => !state[id]);
        }
    }

    return {getSide, move};
}



const summary = (() => {
    const node = document.querySelector(".summary");
    const result = node.querySelector("p");
    const button = node.querySelector("button");
    button.addEventListener("click", () => {
        node.style.display = "none";
        game.restart();
    });

    function show(message) {
        result.innerHTML = message;
        node.style.display = "flex";
        node.classList.add("show");
    }

    return {show};
})();