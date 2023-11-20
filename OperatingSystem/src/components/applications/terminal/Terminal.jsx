import { useEffect, useRef, useState } from "react";
import styles from "./Terminal.module.css";
import { useVirtualRoot } from "../../../hooks/virtual-drive/VirtualRootContext.js";
import { Command } from "../../../features/applications/terminal/commands.js";
import { clamp } from "../../../features/math/clamp.js";
import { OutputLine } from "./OutputLine.jsx";
import { InputLine } from "./InputLine.jsx";

const USERNAME = "user";
const HOSTNAME = "prozilla-os";

export function Terminal({ setTitle }) {
	const [inputKey, setInputKey] = useState(0);
	const [inputValue, setInputValue] = useState("");
	const [history, setHistory] = useState([]);
	const virtualRoot = useVirtualRoot();
	const [currentDirectory, setCurrentDirectory] = useState(virtualRoot.navigate("~"));
	const inputRef = useRef(null);
	const [historyIndex, setHistoryIndex] = useState(0);

	useEffect(() => {
		setTitle(`${USERNAME}@${HOSTNAME}: ${currentDirectory.root ? "/" : currentDirectory.path}`);
	}, [currentDirectory.path, currentDirectory.root, setTitle]);

	const prefix = `${USERNAME}@${HOSTNAME}:${currentDirectory.root ? "/" : currentDirectory.path}$ `;

	const updatedHistory = history;
	const pushHistory = (entry) => {
		updatedHistory.push(entry);
		setHistory(updatedHistory);
	};

	const promptOutput = (text) => {
		pushHistory({
			text,
			isInput: false
		});
	};

	const submitInput = (value) => {
		//console.log(value);
		pushHistory({
			text: prefix + value,
			isInput: true,
			value
		});

		setInputValue("");

		value = value.trim();

		if (value === "")
			return;

		const args = value.split(/ +/);
		const commandName = args.shift().toLowerCase();

		const command = Command.find(commandName);

		if (!command) {
			return promptOutput(`${commandName}: Command not found`);
		}
		
		let response = null;

		try {
			response = command.execute(args, {
				promptOutput,
				pushHistory,
				virtualRoot,
				currentDirectory,
				setCurrentDirectory,
				username: USERNAME,
				hostname: HOSTNAME,
			});

			if (response == null)
				return promptOutput(`${commandName}: Command failed`);
			
			if (!response.blank)
				promptOutput(response);
		} catch (error) {
			console.error(error);
			promptOutput(`${commandName}: Command failed`);
		}
	};

	const updateHistoryIndex = (delta) => {
		const inputHistory = history.filter(({ isInput }) => isInput);
		const index = clamp(historyIndex + delta, 0, inputHistory.length);

		if (index === historyIndex) {
			if (delta < 0) {
				setInputValue("");
			}

			return;
		}

		if (index === 0) {
			setInputValue("");
		} else {
			setInputValue(inputHistory[inputHistory.length - index].value);
		}

		setHistoryIndex(index);
	};

	const onKeyDown = (event) => {
		const value = event.target.value;
		const { key } = event;

		if (key === "Enter") {
			submitInput(value);
			setInputKey((previousKey) =>  previousKey + 1);
		} else if (key === "ArrowUp") {
			updateHistoryIndex(1);
		} else if (key === "ArrowDown") {
			updateHistoryIndex(-1);
		}
	};

	const onChange = (event) => {
		const value = event.target.value;
		return setInputValue(value);
	};

	const displayHistory = () => {
		const visibleHistory = history.slice(-16);
		let startIndex = 0;

		visibleHistory.forEach((entry, index) => {
			if (entry.clear)
				startIndex = index + 1;
		});

		return visibleHistory.slice(startIndex).map(({ text }, index) => {
			return <OutputLine text={text} key={index}/>;
		});
	};

	const onMouseDown = (event) => {
		if (event.button === 2) {
			event.preventDefault();

			navigator.clipboard.readText().then((text) => {
				setInputValue(inputValue + text);
			}).catch((error) => {
				console.error(error);
			});
		}
	};

	const onContextMenu = (event) => {
		event.preventDefault();
	};

	return (
		<div
			className={styles.Terminal}
			onMouseDown={onMouseDown}
			onContextMenu={onContextMenu}
			onClick={(event) => {
				if (window.getSelection().toString() === "") {
					event.preventDefault();
					inputRef.current?.focus();
				}
			}}
		>
			{displayHistory()}
			<InputLine
				key={inputKey}
				value={inputValue}
				prefix={prefix}
				onKeyDown={onKeyDown}
				onChange={onChange}
				inputRef={inputRef}
				history={history}
			/>
		</div>
	);
}