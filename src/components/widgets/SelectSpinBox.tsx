import { CSSProperties, JSX, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { Popover, PopoverProps } from "@mui/material";
import { ArrowDropDown, ArrowDropUp, ArrowLeft, ArrowRight } from "@mui/icons-material";
import useClickAway from "@/services/hooks/useClickAway";

interface SelectSpinBoxElements<T extends string | CSSProperties> {
  buttonsContainer?: T;
  container?: T;
  iconContainer?: T;
  option?: T;
  optionsList?: T;
  next?: T;
  nextIcon?: T;
  prev?: T;
  prevIcon?: T;
  select?: T;
}

interface IProps {
  classes?: SelectSpinBoxElements<string>;
  defaultLabel?: string;
  disableSelect?: boolean;
  hideButtons?: boolean;
  icon?: JSX.Element;
  layout?: "alt" | undefined;
  onChange: (value: string | number) => void;
  options: { label: string, value: string | number }[];
  optionsPopover?: Partial<PopoverProps>;
  showArrow?: boolean;
  style?: SelectSpinBoxElements<CSSProperties>;
  title?: string;
  value: string | number;
}

export default function SelectSpinBox(props: IProps) {
  const { 
    classes, 
    defaultLabel, 
    disableSelect, 
    hideButtons,
    icon, 
    layout, 
    onChange, 
    options, 
    optionsPopover, 
    showArrow, 
    title,
    value
  } = props;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  
  const selectedIdx = options.findIndex(option => option.value === value);

  useLayoutEffect(() => setShowOptions(!!anchorEl), [anchorEl])

  useEffect(() => {
    if (anchorEl && listRef.current) {
      const listItems = listRef.current.getElementsByTagName("li");
      if (selectedIdx > -1)
        listItems[selectedIdx].focus();
    }
  }, [showOptions])

  function getSpinButtons() {
    return ref.current ? Array.from(ref.current.getElementsByTagName("button")) : [];
  }

  const handleClickAway = useCallback((e: MouseEvent | TouchEvent) => {
    const elements = document.elementsFromPoint((e as MouseEvent).clientX, (e as MouseEvent).clientY);
    const preventClickAwayAction = 
      ref.current &&
      elements.includes(ref.current) && 
      elements.every(element => !getSpinButtons().some(button => button.contains(element)));

    if (!preventClickAwayAction)
      setAnchorEl(null);
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (!disableSelect && !anchorEl && document.activeElement === e.currentTarget) 
        setAnchorEl(ref.current);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();

      if (anchorEl && listRef.current) {
        const listItems = Array.from(listRef.current.getElementsByTagName("li"));
        const idx = listItems.findIndex(li => li === document.activeElement);

        if (idx > -1) {
          if (e.key === "ArrowUp")
            listItems[idx === 0 ? listItems.length - 1 : idx - 1].focus();
          else
            listItems[(idx + 1) % listItems.length].focus();
        }
      } else if (!getSpinButtons().some(button => button.contains(document.activeElement))) {
        if (e.key === (layout === "alt" ? "ArrowDown" : "ArrowUp"))
          prev();
        else
          next();
      }
    }
  }
  
  function next() {
    if (selectedIdx === -1)
      onChange(options[options.length - 1].value);
    else if (selectedIdx < options.length - 1)
      onChange(options[selectedIdx + 1].value)
  }

  function prev() {
    if (selectedIdx === -1)
      onChange(options[0].value);
    else if (selectedIdx > 0)
      onChange(options[selectedIdx - 1].value);
  }

  function selectOption(option: { label: string, value: string | number }) {
    onChange(option.value); 
    setAnchorEl(null);
  }

  const listRef = useClickAway<HTMLDivElement>(handleClickAway);

  const empty = options.length === 0;
  const lastSelected = selectedIdx === options.length - 1;

  const style = {
    container: { display: "flex", alignItems: "center", padding: 4, ...props.style?.container },
    select: {
      flex: 1,
      height: "100%",
      backgroundColor: "#0000",
      fontSize: 14,
      opacity: 1,
      cursor: disableSelect ? "default" : "pointer",
      lineHeight: 1,
      border: "none",
      ...props.style?.select
    },
    buttonsContainer: { flexDirection: "column", height: "100%", width: 12, ...props.style?.buttonsContainer },
    spinButton: (disabled: boolean) => ({ 
      position: "relative", 
      backgroundColor: "#0000",
      pointerEvents: disabled ? "none" : "auto",
      opacity: disabled ? 0.2 : 1
    } as const),
    prevIcon: { fontSize: 22, color: "#000", ...props.style?.prevIcon },
    nextIcon: { fontSize: 22, color: "#000", ...props.style?.nextIcon },
    optionsPopover: { 
      width: anchorEl?.offsetWidth, 
      border: "1px solid var(--border6)", 
      borderRadius: 0, 
      transform: "translate(0, -1px)", 
      backgroundColor: "var(--bg2)",
      pointerEvents: "auto",
      padding: 4,
      overflow: "auto",
      ...props.style?.optionsList
    }, 
    option: (option: { label: string, value: string | number }) => ({ 
      backgroundColor: option.value === value ? "var(--color1)" : "", 
      color: option.value === value ? "var(--bg8)" : "var(--border6)",
      fontWeight: option.value === value ? "bold" : "normal",
      fontSize: 14,
      lineHeight: 1,
      padding: 4,
      whiteSpace: "nowrap",
      ...props.style?.option
    })
  } as const;
  
  return (
    <div
      className={`position-relative ${classes?.container}`}
      onKeyDown={handleKeyDown}
      ref={ref}
      style={style.container}
      tabIndex={0}
      title={title}
    >
      {layout === "alt" && !hideButtons && (
        <button
          className={`p-0 center-flex ${classes?.prev}`}
          onClick={prev}
          style={{ height: "100%", ...style.spinButton(selectedIdx === 0 || empty), ...props.style?.prev }}
          tabIndex={selectedIdx === 0 || empty ? -1 : 0}
        >
          <ArrowLeft className={"center-absolute " + classes?.prevIcon} style={style.prevIcon} />
        </button>
      )}
      {icon && (
        <div
          className={`p-1 d-flex justify-content-center align-items-center ${classes?.iconContainer}`}
          style={{ height: "100%", marginRight: 4, ...props.style?.iconContainer }}
        >
          {icon}
        </div>
      )}
      <div
        className={`d-flex align-items-center overflow-hidden no-outline ${classes?.select}`}
        onClick={() => { if (!disableSelect) setAnchorEl(ref.current); }}
        style={style.select}
      >
        {selectedIdx === -1 ? (
          <p className="m-0 flex-grow-1">{defaultLabel}</p>
        ) : (
          <p className="m-0 flex-grow-1">{options[selectedIdx].label}</p>
        )}
        {showArrow && <MdKeyboardArrowDown /> }
      </div>
      {layout !== "alt" && !hideButtons && (
        <div className={`d-flex p-0 ${classes?.buttonsContainer}`} style={style.buttonsContainer}>
          <button
            className={`p-0 center-flex overflow-hidden ${classes?.prev}`}
            onClick={prev}
            style={{ height: "50%", ...style.spinButton(selectedIdx === 0 || empty), ...props.style?.prev }}
            tabIndex={selectedIdx === 0 || empty ? -1 : 0}
          >
            <ArrowDropUp className={"center-absolute " + classes?.prevIcon} style={style.prevIcon} />
          </button>
          <button
            className={`p-0 center-flex overflow-hidden ${classes?.next}`}
            onClick={next}
            style={{ height: "50%", ...style.spinButton(lastSelected || empty), ...props.style?.next }}
            tabIndex={lastSelected || empty ? -1 : 0}
          >
            <ArrowDropDown className={"center-absolute " + classes?.nextIcon} style={style.nextIcon} />
          </button>
        </div>
      )}
      {layout === "alt" && !hideButtons && (
        <button
          className={`p-0 center-flex ${classes?.next}`}
          onClick={next}
          style={{ height: "100%", ...style.spinButton(lastSelected || empty), ...props.style?.next }}
          tabIndex={lastSelected || empty ? -1 : 0}
        >
          <ArrowRight className={"center-absolute " + classes?.nextIcon} style={style.nextIcon} />
        </button>
      )}
      <Popover
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        className={"stop-reorder " + classes?.optionsList}
        onClose={(_, reason) => { if (reason === "escapeKeyDown") setAnchorEl(null); }}
        slotProps={{ paper: { className: "scrollbar", ref: listRef, style: style.optionsPopover } }}
        transitionDuration={0}
        {...optionsPopover}
        anchorEl={anchorEl}
        open={!!anchorEl}
      >
        <ul style={{ listStyleType: "none", margin: 0, padding: 0, width: "fit-content", minWidth: "100%" }}>
          {options.map((option, idx) => (
            <li
              className={"hover-3 " + classes?.option}
              key={idx} 
              onClick={() => selectOption(option)}
              onKeyDown={e => { if (e.key === "Enter") selectOption(option); }}
              style={style.option(option)}
              tabIndex={0}
            >
              {option.label}
            </li>
          ))}
        </ul>
      </Popover>
    </div>
  )
}