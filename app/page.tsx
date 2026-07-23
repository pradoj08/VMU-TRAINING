"use client";

import { FormEvent, PointerEvent as ReactPointerEvent, useEffect, useState } from "react";

const REQUIRED_LOCATION = "B 372 - HOUSTON - TX";
const REQUIRED_EQUIPMENT = "112389";

const WORK_ORDERS = [
  { track: "6-801", inboundRetrieve: 0, inboundClear: 22, outboundRetrieve: 0, outboundPlace: 0, outboundClear: 0, shotgun: 0, all: 22 },
  { track: "6-802", inboundRetrieve: 18, inboundClear: 23, outboundRetrieve: 0, outboundPlace: 0, outboundClear: 0, shotgun: 0, all: 41 },
  { track: "6-804", inboundRetrieve: 0, inboundClear: 8, outboundRetrieve: 0, outboundPlace: 0, outboundClear: 1, shotgun: 0, all: 9 },
  { track: "6-808", inboundRetrieve: 0, inboundClear: 28, outboundRetrieve: 0, outboundPlace: 0, outboundClear: 0, shotgun: 0, all: 28 },
  { track: "6-809", inboundRetrieve: 0, inboundClear: 3, outboundRetrieve: 0, outboundPlace: 0, outboundClear: 0, shotgun: 0, all: 3 },
];

function CountButton({
  count,
  label,
  isWrong,
  onSelect,
}: {
  count: number;
  label: string;
  isWrong: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`count-button${isWrong ? " wrong-choice" : ""}`}
      type="button"
      aria-label={`${label}: ${count} work orders${isWrong ? ", incorrect choice" : ""}`}
      onClick={onSelect}
    >
      <span>{count}</span>
      {isWrong && <span className="choice-x" aria-hidden="true">×</span>}
    </button>
  );
}

const FAKE_WORK_ROWS = [
  ["YMMU 752421", "TNPZ 498817", "1", "DTTX 742768", "BB1", "CLEAR", "40", "51596", "TGRP", "06801-801", "", "YANGMINMARLI"],
  ["CAAU 523709", "APMZ 406358", "1", "DTTX 742768", "CB1", "CLEAR", "40", "17785", "DCLP", "06801-801", "", "MAERSK"],
  ["YMMU 739370", "TNPZ 494529", "1", "DTTX 742768", "DB1", "CLEAR", "40", "51596", "TGRP", "06801-801", "", "YANGMINMARLI"],
  ["CAAU 930869", "EMCZ 542865", "1", "DTTX 742768", "EB1", "CLEAR", "40", "17311", "DCLP", "06801-801", "", "MAERSK"],
  ["YMMU 646806", "TNPZ 498588", "1", "DTTX 742768", "AB1", "CLEAR", "40", "51596", "TGRP", "06801-801", "", "YANGMINMARLI"],
  ["HAMU 448694", "TNPZ 471499", "2", "DTTX 781228", "AB1", "CLEAR", "40", "50418", "TGRP", "06801-801", "", "HAPAGLLOAMEL"],
];

const CORRECT_WORK_ROWS = [
  ["EMHU 200479", "1", "DTTX 657068", "BB1", "RETRIEVE", "53", "23078", "DCLI", "DIRT - DIRT", "Trackside", "CELTICINTLLC"],
  ["GCXU 519814", "2", "DTTX 785369", "BT1", "RETRIEVE", "40", "23200", "NONE", "DIRT - DIRT", "Trackside", "IMCCOMLLC"],
  ["YMMU 686166", "2", "DTTX 785369", "CB1", "RETRIEVE", "40", "20861", "TGRP", "DIRT - DIRT", "Trackside", "YANGMINMARLI"],
  ["TLLU 529077", "2", "DTTX 785369", "DB1", "RETRIEVE", "40", "53588", "TGRP", "DIRT - DIRT", "Trackside", "HAPAGLLOAMEL"],
  ["GCXU 520695", "2", "DTTX 785369", "EB1", "RETRIEVE", "40", "20908", "FGCP", "DIRT - DIRT", "Trackside", "OCEANNETEXPP"],
  ["CAAU 574530", "2", "DTTX 785369", "AB1", "RETRIEVE", "40", "65416", "TGRP", "DIRT - DIRT", "Trackside", "HAPAGLLOAMEL"],
];

const SEQUENCE_OPTIONS = [
  "Default",
  "Bottoms Only",
  "Bottoms Forward, Tops Back",
  "Bottom, Top Alternating",
  "Bottoms Then Tops",
  "Tops Only",
  "Tops Forward, Bottoms Back",
  "Top, Bottom Alternating",
  "Tops Then Bottoms",
];

type VisualItem = "yard-image" | "chassis" | "tnpz-flag" | "blue-note" | "orange-note";
type VisualTransform = { x: number; y: number; scale: number };

const DEFAULT_VISUAL_LAYOUT: Record<VisualItem, VisualTransform> = {
  "yard-image": { x: -41, y: 125, scale: 1.78 },
  "chassis": { x: 228, y: 209, scale: 0.79 },
  "tnpz-flag": { x: -585, y: 271, scale: 0.43 },
  "blue-note": { x: -474, y: 74, scale: 0.69 },
  "orange-note": { x: -471, y: 182, scale: 0.69 },
};

const DEFAULT_CHASSIS_OPTION_LAYOUTS: Record<string, VisualTransform> = {
  dclz: { x: 228, y: 209, scale: 0.79 },
  tnpz: { x: 228, y: 209, scale: 0.79 },
  fxvz: { x: 228, y: 209, scale: 0.79 },
  sncz: { x: 228, y: 209, scale: 0.79 },
};

const LAYOUT_STORAGE_KEY = "hostler-training-visual-layout-v6";
const PANEL_STORAGE_KEY = "hostler-training-editor-position";
const INSTRUCTION_STORAGE_KEY = "hostler-training-instruction-layout";
const CHASSIS_LAYOUT_STORAGE_KEY = "hostler-training-chassis-option-layouts";
const HOSTLER_LAYOUT_STORAGE_KEY = "hostler-training-login-hostler-layout";

function loadStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
  } catch {
    return fallback;
  }
}

function LayoutControls({
  label,
  className,
  value,
  onMove,
  onResize,
}: {
  label: string;
  className: string;
  value: VisualTransform;
  onMove: (x: number, y: number) => void;
  onResize: (amount: number) => void;
}) {
  return (
    <div className={`visual-edit-controls ${className}`} aria-label={`${label} layout controls`}>
      <strong>{label}</strong>
      <div className="visual-edit-values" aria-label={`${label} current values`}>
        <b>X {Math.round(value.x)}</b>
        <b>Y {Math.round(value.y)}</b>
        <b>SIZE {Math.round(value.scale * 100)}%</b>
      </div>
      <div>
        <span>MOVE</span>
        <button type="button" aria-label={`Move ${label} left`} onClick={() => onMove(-10, 0)}>←</button>
        <button type="button" aria-label={`Move ${label} up`} onClick={() => onMove(0, -10)}>↑</button>
        <button type="button" aria-label={`Move ${label} down`} onClick={() => onMove(0, 10)}>↓</button>
        <button type="button" aria-label={`Move ${label} right`} onClick={() => onMove(10, 0)}>→</button>
      </div>
      <div>
        <span>RESIZE</span>
        <button type="button" aria-label={`Make ${label} smaller`} onClick={() => onResize(-0.08)}>−</button>
        <button type="button" aria-label={`Make ${label} larger`} onClick={() => onResize(0.08)}>+</button>
      </div>
    </div>
  );
}

function EmptyWorkOrder({
  title,
  showData,
  isCorrect = false,
  onBack,
  onTrainingComplete,
}: {
  title: string;
  showData: boolean;
  isCorrect?: boolean;
  onBack: () => void;
  onTrainingComplete?: () => void;
}) {
  const [showTryAgain, setShowTryAgain] = useState(true);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [direction, setDirection] = useState<"north" | "south">("north");
  const [sequence, setSequence] = useState("Default");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [sequenceMenuOpen, setSequenceMenuOpen] = useState(false);
  const [railcarInquiry, setRailcarInquiry] = useState<{
    railcar: string;
    sequence: string;
    track: string;
    rows: Array<{
      equipment: string;
      well: string;
      status: string;
      owner: string;
    }>;
  } | null>(null);
  const [equipmentView, setEquipmentView] = useState<{
    equipment: string;
    railcar: string;
    well: string;
    length: string;
    pool: string;
    shipper: string;
  } | null>(null);
  const [matchChassis, setMatchChassis] = useState<{
    equipment: string;
    length: string;
    railcar: string;
    pool: string;
    weight: string;
    well: string;
    shipper: string;
    sequence: string;
  } | null>(null);
  const [chassisNumber, setChassisNumber] = useState("");
  const [chassisNumberError, setChassisNumberError] = useState(false);
  const [railcarChassisIndex, setRailcarChassisIndex] = useState(0);
  const [railcarChassisError, setRailcarChassisError] = useState(false);
  const [chassisMatched, setChassisMatched] = useState(false);
  const [completedEquipment, setCompletedEquipment] = useState<Set<string>>(() => new Set());
  const [equipmentSelectionError, setEquipmentSelectionError] = useState(false);
  const [showCompletionSuccess, setShowCompletionSuccess] = useState(false);
  const [showAdHocMove, setShowAdHocMove] = useState(false);
  const [adHocEquipmentNumber, setAdHocEquipmentNumber] = useState("");
  const [adHocMoveError, setAdHocMoveError] = useState(false);
  const [revealedMatchAlerts, setRevealedMatchAlerts] = useState({ pool: false, shipper: false });
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [selectedVisual, setSelectedVisual] = useState<VisualItem | null>(null);
  const [visualLayout, setVisualLayout] = useState(() => loadStoredValue(LAYOUT_STORAGE_KEY, DEFAULT_VISUAL_LAYOUT));
  const [chassisOptionLayouts, setChassisOptionLayouts] = useState(() => loadStoredValue(CHASSIS_LAYOUT_STORAGE_KEY, DEFAULT_CHASSIS_OPTION_LAYOUTS));
  const [editPanelPosition, setEditPanelPosition] = useState(() => loadStoredValue(PANEL_STORAGE_KEY, { x: 12, y: 12 }));
  const [layoutSaved, setLayoutSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowTryAgain(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    [
      "/chassis-option-dclz-424751.webp",
      "/chassis-40-cropped.png",
      "/chassis-isolated-fxvz-568112.png",
      "/chassis-isolated-sncz-176119.png",
    ].forEach((source) => {
      const image = new Image();
      image.src = source;
    });
  }, []);

  const columns = isCorrect
    ? ["Equipment ID", "Seq", "Railcar ID", "Well", "Type", "Len", "Weight", "Pool", "From Location", "To Location", "Shipper", "Action"]
    : showData
    ? ["Equipment ID", "Chassis ID", "Seq", "Railcar ID", "Well", "Type", "Len", "Weight", "Pool", "From Location", "To Location", "Shipper", "Action"]
    : ["Equipment ID", "Seq", "Railcar ID", "Well", "Type", "Len", "Weight", "Pool", "From Location", "To Location", "Shipper", "Action"];
  const displayedRows = isCorrect ? CORRECT_WORK_ROWS : FAKE_WORK_ROWS;
  const wellIndex = isCorrect ? 3 : 4;
  const activeRows = displayedRows.filter((row) => {
    if (completedEquipment.has(row[0])) return false;
    if (sequence === "Tops Only" && !row[wellIndex].toUpperCase().includes("T")) return false;
    if (sequence === "Bottoms Only" && row[wellIndex].toUpperCase().includes("T")) return false;
    const equipmentQuery = equipmentFilter.replace(/\s+/g, "").toUpperCase();
    if (equipmentQuery && !row[0].replace(/\s+/g, "").toUpperCase().includes(equipmentQuery)) return false;
    return true;
  });
  const orderedRows = direction === "north" ? activeRows : [...activeRows].reverse();

  function changeDirection(nextDirection: "north" | "south") {
    setDirection(nextDirection);
    setSelectedRow(null);
    setOpenActionMenu(null);
  }

  function changeVisual(item: VisualItem, x: number, y: number, scaleAmount = 0) {
    if (item === "chassis") {
      setChassisOptionLayouts((current) => {
        const value = current[selectedRailcarChassis.id];
        return {
          ...current,
          [selectedRailcarChassis.id]: {
            x: value.x + x,
            y: value.y + y,
            scale: Math.min(2.25, Math.max(0.35, value.scale + scaleAmount)),
          },
        };
      });
      return;
    }
    setVisualLayout((current) => ({
      ...current,
      [item]: {
        x: current[item].x + x,
        y: current[item].y + y,
        scale: Math.min(2.25, Math.max(0.35, current[item].scale + scaleAmount)),
      },
    }));
  }

  function visualStyle(item: VisualItem) {
    const value = item === "chassis" ? chassisOptionLayouts[selectedRailcarChassis.id] : visualLayout[item];
    return { transform: `translate(${value.x}px, ${value.y}px) scale(${value.scale})` };
  }

  function beginVisualDrag(item: VisualItem, event: ReactPointerEvent<HTMLElement>) {
    if (!layoutEditMode || (event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    setSelectedVisual(item);
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = item === "chassis" ? chassisOptionLayouts[selectedRailcarChassis.id] : visualLayout[item];
    const move = (pointerEvent: PointerEvent) => {
      if (item === "chassis") {
        setChassisOptionLayouts((current) => ({
          ...current,
          [selectedRailcarChassis.id]: {
            ...current[selectedRailcarChassis.id],
            x: initial.x + pointerEvent.clientX - startX,
            y: initial.y + pointerEvent.clientY - startY,
          },
        }));
        return;
      }
      setVisualLayout((current) => ({
        ...current,
        [item]: { ...current[item], x: initial.x + pointerEvent.clientX - startX, y: initial.y + pointerEvent.clientY - startY },
      }));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function beginVisualResize(item: VisualItem, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!layoutEditMode) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedVisual(item);
    const startX = event.clientX;
    const startY = event.clientY;
    const initialScale = item === "chassis" ? chassisOptionLayouts[selectedRailcarChassis.id].scale : visualLayout[item].scale;
    const move = (pointerEvent: PointerEvent) => {
      const distance = ((pointerEvent.clientX - startX) + (pointerEvent.clientY - startY)) / 260;
      if (item === "chassis") {
        setChassisOptionLayouts((current) => ({
          ...current,
          [selectedRailcarChassis.id]: {
            ...current[selectedRailcarChassis.id],
            scale: Math.min(2.25, Math.max(0.35, initialScale + distance)),
          },
        }));
        return;
      }
      setVisualLayout((current) => ({
        ...current,
        [item]: { ...current[item], scale: Math.min(2.25, Math.max(0.35, initialScale + distance)) },
      }));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function resizeHandle(item: VisualItem) {
    if (!layoutEditMode) return null;
    return (
      <button
        className="direct-resize-handle"
        type="button"
        aria-label={`Resize ${item}`}
        onPointerDown={(event) => beginVisualResize(item, event)}
      />
    );
  }

  function beginPanelDrag(event: ReactPointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = editPanelPosition;
    const move = (pointerEvent: PointerEvent) => {
      setEditPanelPosition({
        x: Math.max(0, Math.min(window.innerWidth - 180, initial.x + pointerEvent.clientX - startX)),
        y: Math.max(0, Math.min(window.innerHeight - 54, initial.y + pointerEvent.clientY - startY)),
      });
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function saveLayoutSettings() {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(visualLayout));
    window.localStorage.setItem(CHASSIS_LAYOUT_STORAGE_KEY, JSON.stringify(chassisOptionLayouts));
    window.localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(editPanelPosition));
    setLayoutSaved(true);
    window.setTimeout(() => setLayoutSaved(false), 1800);
  }

  function resetVisualLayout() {
    const resetLayout = Object.fromEntries(
      Object.entries(DEFAULT_VISUAL_LAYOUT).map(([item, value]) => [item, { ...value }]),
    ) as Record<VisualItem, VisualTransform>;

    setVisualLayout(resetLayout);
    const resetChassisLayouts = Object.fromEntries(
      Object.entries(DEFAULT_CHASSIS_OPTION_LAYOUTS).map(([item, value]) => [item, { ...value }]),
    );
    setChassisOptionLayouts(resetChassisLayouts);
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(resetLayout));
    window.localStorage.setItem(CHASSIS_LAYOUT_STORAGE_KEY, JSON.stringify(resetChassisLayouts));
  }

  const selectedEquipment = selectedRow === null ? null : orderedRows[selectedRow]?.[0];
  const targetEquipment = matchChassis?.equipment ?? selectedEquipment;
  const matchingOrangeContainer = targetEquipment === "GCXU 520695";
  const expectedChassisNumber = matchingOrangeContainer ? "568112" : "456231";
  const railcarChassisOptions = [
    { id: "dclz", number: "DCLZ 424751", image: "/chassis-option-dclz-424751.webp", correct: false },
    { id: "tnpz", number: "TNPZ 456231", image: "/chassis-40-cropped.png", correct: !matchingOrangeContainer },
    { id: "fxvz", number: "FXVZ 568112", image: "/chassis-isolated-fxvz-568112.png", correct: matchingOrangeContainer },
    { id: "sncz", number: "SNCZ 176119", image: "/chassis-isolated-sncz-176119.png", correct: false },
  ];
  const selectedRailcarChassis = railcarChassisOptions[railcarChassisIndex];
  const topContainerFirstAlert = matchChassis?.equipment === "GCXU 520695"
    && chassisNumber === "456231"
    && !completedEquipment.has("GCXU 519814");

  return (
    <main className="empty-order-page">
      <section className="empty-order-content">
        <div className="empty-order-toolbar">
          <h1>Hostler Work Orders: {title}</h1>
          <div className="direction-options" aria-label="Work direction">
            <button
              className={`direction${direction === "north" ? " active" : ""}`}
              type="button"
              aria-pressed={direction === "north"}
              onClick={() => changeDirection("north")}
            >
              {direction === "north" && <>●&nbsp; </>}North To South
            </button>
            <button
              className={`direction${direction === "south" ? " active" : ""}`}
              type="button"
              aria-pressed={direction === "south"}
              onClick={() => changeDirection("south")}
            >
              {direction === "south" && <>●&nbsp; </>}South To North
            </button>
          </div>
          <div className="sequence-field">
            <button
              className="sequence-trigger"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={sequenceMenuOpen}
              onClick={() => setSequenceMenuOpen((open) => !open)}
            >
              <span>Change Work Sequence</span>
              <strong>{sequence}</strong>
              <b aria-hidden="true">{sequenceMenuOpen ? "▴" : "▾"}</b>
            </button>
            {sequenceMenuOpen && (
              <div className="sequence-menu" role="listbox" aria-label="Change Work Sequence">
                {SEQUENCE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    className={sequence === option ? "selected" : undefined}
                    type="button"
                    role="option"
                    aria-selected={sequence === option}
                    onClick={() => {
                      setSequence(option);
                      setSequenceMenuOpen(false);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="empty-filters">
          <label className={equipmentFilter ? "has-filter-value" : undefined}>
            <span>Equipment ID</span>
            <input
              aria-label="Equipment ID"
              autoComplete="off"
              value={equipmentFilter}
              onChange={(event) => {
                setEquipmentFilter(event.target.value);
                setSelectedRow(null);
                setOpenActionMenu(null);
              }}
            />
          </label>
          <label><span>Seq St</span><input aria-label="Sequence start" /></label>
          <label><span>Seq End</span><input aria-label="Sequence end" /></label>
          <button
            className={layoutEditMode ? "columns-layout-active" : undefined}
            type="button"
            aria-pressed={layoutEditMode}
            onClick={() => setLayoutEditMode((active) => !active)}
          >
            {layoutEditMode ? "DONE EDITING" : "COLUMNS"}
          </button>
        </div>

        <table className="empty-order-table">
          <thead>
            <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {showData ? orderedRows.map((row, rowIndex) => (
              <tr key={row[0]} className={selectedRow === rowIndex ? "selected-work-row" : undefined}>
                {row.map((value, index) => (
                  <td key={`${row[0]}-${index}`} className={index === 0 ? "equipment-number" : undefined}>{value}</td>
                ))}
                <td className="row-actions">
                  <button
                    className={selectedRow === rowIndex ? "selected-row-button" : undefined}
                    type="button"
                    aria-pressed={selectedRow === rowIndex}
                    onClick={() => {
                      if (selectedRow === rowIndex) {
                        const expectedEquipment = completedEquipment.has("GCXU 519814")
                          ? "GCXU 520695"
                          : "GCXU 519814";
                        if (row[0] !== expectedEquipment) {
                          setEquipmentSelectionError(true);
                          return;
                        }
                        setEquipmentSelectionError(false);
                        setMatchChassis({
                          equipment: row[0],
                          sequence: row[isCorrect ? 1 : 2],
                          railcar: row[isCorrect ? 2 : 3],
                          well: row[isCorrect ? 3 : 4],
                          length: row[isCorrect ? 5 : 6],
                          weight: row[isCorrect ? 6 : 7],
                          pool: row[isCorrect ? 7 : 8],
                          shipper: row.at(-1) ?? "",
                        });
                        setChassisNumber("");
                        setChassisNumberError(false);
                        setChassisMatched(false);
                        setRevealedMatchAlerts({ pool: false, shipper: false });
                      } else {
                        setEquipmentSelectionError(false);
                        setSelectedRow(rowIndex);
                        setOpenActionMenu(null);
                      }
                    }}
                  >
                    {selectedRow === rowIndex ? "COMPLETE" : "SELECT"}
                  </button>
                  <button
                    type="button"
                    aria-expanded={openActionMenu === rowIndex}
                    aria-haspopup="menu"
                    onClick={() => setOpenActionMenu((current) => current === rowIndex ? null : rowIndex)}
                  >
                    OPTIONS
                  </button>
                  {openActionMenu === rowIndex && (
                    <div className="row-action-menu" role="menu">
                      {selectedRow === rowIndex && (
                        <button
                          className="unselect-menu-item"
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setSelectedRow(null);
                            setOpenActionMenu(null);
                          }}
                        >
                          Unselect
                        </button>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setEquipmentView({
                            equipment: row[0],
                            railcar: row[isCorrect ? 2 : 3],
                            well: row[isCorrect ? 3 : 4],
                            length: row[isCorrect ? 5 : 6],
                            pool: row[isCorrect ? 7 : 8],
                            shipper: row.at(-1) ?? "",
                          });
                          setOpenActionMenu(null);
                        }}
                      >
                        View Equipment
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          const sequenceIndex = isCorrect ? 1 : 2;
                          const railcarIndex = isCorrect ? 2 : 3;
                          const wellIndex = isCorrect ? 3 : 4;
                          const statusIndex = isCorrect ? 4 : 5;
                          const selectedRailcar = row[railcarIndex];
                          setRailcarInquiry({
                            railcar: selectedRailcar,
                            sequence: row[sequenceIndex],
                            track: title.split(" ").at(-1) ?? "6-802",
                            rows: displayedRows
                              .filter((workRow) => workRow[railcarIndex] === selectedRailcar)
                              .map((workRow) => ({
                                equipment: workRow[0],
                                well: workRow[wellIndex],
                                status: workRow[statusIndex],
                                owner: workRow.at(-1) ?? "",
                              })),
                          });
                          setOpenActionMenu(null);
                        }}
                      >
                        Railcar Inquiry
                      </button>
                      <button type="button" role="menuitem">Report Misplaced</button>
                      <button type="button" role="menuitem">Report Railcar Issue</button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr className="no-data-row"><td colSpan={columns.length}>No Data Found</td></tr>
            )}
            {showData && activeRows.length < displayedRows.length && (
              <tr className="reserved-work-row-space" aria-hidden="true">
                <td
                  colSpan={columns.length}
                  style={{ height: `${(displayedRows.length - activeRows.length) * 62}px` }}
                />
              </tr>
            )}
          </tbody>
        </table>
        {isCorrect && equipmentSelectionError && (
          <div className="selection-toast wrong list-try-again equipment-selection-error" role="alert">
            <span className="selection-icon" aria-hidden="true">×</span>
            <strong>Incorrect equipment. Select the correct container and try again.</strong>
          </div>
        )}
        {!isCorrect && showTryAgain && showData && (
          <div className="selection-toast wrong list-try-again" role="alert">
            <span className="selection-icon" aria-hidden="true">×</span>
            <strong>Try again</strong>
          </div>
        )}
        {isCorrect && (
          <figure className="correct-yard-instruction correct-railcar-visual">
            <div className={`railcar-image-stage${layoutEditMode ? " layout-editing" : ""}`}>
              <div
                className={`railcar-layer-wrapper${selectedVisual === "yard-image" ? " direct-visual-selected" : ""}`}
                style={visualStyle("yard-image")}
                onPointerDown={(event) => beginVisualDrag("yard-image", event)}
              >
                <img className="railcar-layer" src="/trackside-intermodal.png" alt="Double-stack intermodal railcar" />
                {completedEquipment.has("GCXU 519814") && <div className="removed-container-mask blue-container-mask" aria-hidden="true"></div>}
                {completedEquipment.has("GCXU 520695") && <div className="removed-container-mask orange-container-mask" aria-hidden="true"></div>}
                {resizeHandle("yard-image")}
              </div>
              {!completedEquipment.has("GCXU 520695") && (
                <>
                  <div
                    className={`standalone-chassis-wrapper${matchChassis ? " match-focus-visible" : ""}${selectedVisual === "chassis" ? " direct-visual-selected" : ""}`}
                    style={visualStyle("chassis")}
                    onPointerDown={(event) => beginVisualDrag("chassis", event)}
                  >
                    <img
                      key={selectedRailcarChassis.id}
                      className="standalone-chassis-layer chassis-swap-enter"
                      src={selectedRailcarChassis.image}
                      alt={`Chassis ${selectedRailcarChassis.number}`}
                    />
                    {resizeHandle("chassis")}
                  </div>
                  <div
                    className={`tnpz-flag${matchChassis ? " match-focus-visible" : ""}${selectedVisual === "tnpz-flag" ? " direct-visual-selected" : ""}`}
                    style={visualStyle("tnpz-flag")}
                    onPointerDown={(event) => beginVisualDrag("tnpz-flag", event)}
                  >
                    {selectedRailcarChassis.number}
                    {resizeHandle("tnpz-flag")}
                  </div>
                </>
              )}
              {!layoutEditMode && (
                <>
                  <button
                    className="railcar-chassis-arrow previous"
                    type="button"
                    aria-label="Previous chassis option"
                    onClick={() => {
                      setRailcarChassisIndex((index) => (index - 1 + railcarChassisOptions.length) % railcarChassisOptions.length);
                      setRailcarChassisError(false);
                    }}
                  >←</button>
                  <button
                    className="railcar-chassis-arrow next"
                    type="button"
                    aria-label="Next chassis option"
                    onClick={() => {
                      setRailcarChassisIndex((index) => (index + 1) % railcarChassisOptions.length);
                      setRailcarChassisError(false);
                    }}
                  >→</button>
                  {railcarChassisError && (
                    <div className="railcar-chassis-status incorrect" role="alert">
                      <span>Incorrect chassis. Note the chassis pool and try again.</span>
                    </div>
                  )}
                </>
              )}
              {!completedEquipment.has("GCXU 519814") && (
                <div className={`unit-zoom-card blue-card${selectedVisual === "blue-note" ? " direct-visual-selected" : ""}`} style={visualStyle("blue-note")} onPointerDown={(event) => beginVisualDrag("blue-note", event)}>
                  <span>BLUE CONTAINER</span>
                  <strong>GCXU 519814</strong>
                  {resizeHandle("blue-note")}
                </div>
              )}
              {!completedEquipment.has("GCXU 520695") && (
                <div className={`unit-zoom-card orange-card${selectedVisual === "orange-note" ? " direct-visual-selected" : ""}`} style={visualStyle("orange-note")} onPointerDown={(event) => beginVisualDrag("orange-note", event)}>
                  <span>ORANGE CONTAINER</span>
                  <strong>GCXU 520695</strong>
                  {resizeHandle("orange-note")}
                </div>
              )}
              {layoutEditMode && (
                <div
                  className="visual-edit-panel"
                  style={{ left: editPanelPosition.x, top: editPanelPosition.y }}
                >
                  <div className="visual-edit-panel-handle" onPointerDown={beginPanelDrag}>
                    <strong>LAYOUT EDITOR</strong>
                    <span>DRAG TO MOVE PANEL</span>
                  </div>
                  <div className="visual-edit-panel-tools">
                  {([
                    ["yard-image", "YARD IMAGE"],
                    ["chassis", "CHASSIS"],
                    ["tnpz-flag", "CHASSIS LABEL"],
                    ["blue-note", "BLUE TEXT"],
                    ["orange-note", "ORANGE TEXT"],
                  ] as Array<[VisualItem, string]>).map(([item, label]) => (
                    <LayoutControls
                      key={item}
                      label={label}
                      className={`${item}-controls`}
                      value={item === "chassis" ? chassisOptionLayouts[selectedRailcarChassis.id] : visualLayout[item]}
                      onMove={(x, y) => changeVisual(item, x, y)}
                      onResize={(amount) => changeVisual(item, 0, 0, amount)}
                    />
                  ))}
                  <button className="reset-visual-layout" type="button" onClick={resetVisualLayout}>RESET ALL</button>
                  <button className="save-visual-layout" type="button" onClick={saveLayoutSettings}>
                    {layoutSaved ? "SAVED ✓" : "SAVE SETTINGS"}
                  </button>
                  </div>
                </div>
              )}
            </div>
          </figure>
        )}
      </section>

      <nav className="empty-actions" aria-label="Work order actions">
        {!isCorrect && (
          <div className="menu-guidance" aria-hidden="true">
            <span>SELECT WORK ORDER MENU</span>
            <b>↓</b>
          </div>
        )}
        <button className="work-order-menu" type="button" onClick={onBack}>WORK ORDER MENU</button>
        <button type="button">REPORT MISPLACED</button>
        <button type="button">SHOTGUN</button>
        <button
          type="button"
          onClick={() => {
            setAdHocEquipmentNumber("");
            setAdHocMoveError(false);
            setShowAdHocMove(true);
          }}
        >
          MOVE
        </button>
        <button type="button">WORK BY NUMBER</button>
        <button type="button">↻&nbsp; REFRESH</button>
        <button type="button">ENABLE WORK SCREEN</button>
      </nav>

      {!isCorrect && showTryAgain && !showData && (
        <div className={`selection-toast wrong empty-try-again${!showData ? " zero-try-again" : ""}`} role="alert">
          <span className="selection-icon" aria-hidden="true">×</span>
          <strong>Try again</strong>
        </div>
      )}
      {showAdHocMove && (
        <div className="ad-hoc-move-overlay" role="dialog" aria-modal="true" aria-labelledby="ad-hoc-move-title">
          <section className="ad-hoc-move-dialog">
            <h2 id="ad-hoc-move-title">Ad Hoc Move</h2>
            <div className="ad-hoc-move-search">
              <label className={adHocMoveError ? "ad-hoc-field-error" : undefined}>
                <span>Equipment Number</span>
                <input
                  value={adHocEquipmentNumber}
                  inputMode="numeric"
                  maxLength={6}
                  aria-invalid={adHocMoveError}
                  aria-describedby="ad-hoc-move-help"
                  onChange={(event) => {
                    setAdHocEquipmentNumber(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setAdHocMoveError(false);
                  }}
                />
                <b aria-hidden="true">⌕</b>
              </label>
              <button
                type="button"
                onClick={() => setAdHocMoveError(adHocEquipmentNumber.length < 3)}
              >
                SEARCH
              </button>
            </div>
            <div className={`ad-hoc-move-help${adHocMoveError ? " error" : ""}`} id="ad-hoc-move-help">
              <span>{adHocMoveError ? "Enter at least 3 digits" : "Required: Enter 3 to 6 digits of Equipment Number"}</span>
              <b>{adHocEquipmentNumber.length}/6</b>
            </div>
            <button className="ad-hoc-move-close" type="button" onClick={() => setShowAdHocMove(false)}>CLOSE</button>
          </section>
        </div>
      )}
      {equipmentView && (
        <div className="equipment-view-overlay" role="dialog" aria-modal="true" aria-labelledby="equipment-view-title">
          <section className="equipment-view-dialog">
            <header>
              <h2 id="equipment-view-title">View Equipment</h2>
              <button type="button" aria-label="Close View Equipment" onClick={() => setEquipmentView(null)}>×</button>
            </header>
            <div className="equipment-summary-grid">
              {[
                ["Equipment ID", equipmentView.equipment],
                ["Matched Chassis", "N/A"],
                ["Shipper", equipmentView.shipper],
                ["Status", "On Train - Unload Ready"],
                ["L/E", "Load"],
                ["TCS Car Kind", "K4E"],
                ["TCS Car Kind (Chassis)", "N/A"],
                ["Last Yard Checked", "07/18/2026 12:16"],
                ["Parking", "N/A"],
                ["Gross Weight (Tons/Pounds)", "15.3 / 30,534 LBS"],
                ["Pool", equipmentView.pool],
                ["Pool (Chassis)", "N/A"],
                ["Container Outside Length (FT)", equipmentView.length],
                ["Chassis Outside Length (FT)", "N/A"],
                ["Flip Authorized", "No"],
                ["Hold Code", "N/A"],
                ["Commodity / STCC", "4611110 / 4611110"],
                ["Arrival Date", "07/15/2026 11:20"],
                ["Dwell", "9 Hours"],
                ["Special Condition Code", "COFC,In-Bond,Import Shipment"],
                ["Chassis Hold Code", "N/A"],
                ["Yard Block", "HODS"],
                ["Reefer", "No"],
                ["Hazardous", "No"],
                ["Next System Destination", "HOUSTON, TX (B 372)"],
              ].map(([label, value]) => (
                <dl key={label}><dt>{label}</dt><dd>{value}</dd></dl>
              ))}
            </div>
            <h3>Equipment Activity</h3>
            <div className="equipment-activity-scroll">
              <table>
                <thead><tr><th>Location</th><th>Status</th><th>Date/Time</th><th>Details</th><th>User</th></tr></thead>
                <tbody>
                  {[
                    ["B 372", "Current Unload", "07/22/2026 00:23", `23-802 / ${equipmentView.railcar} ${equipmentView.well} / ${equipmentView.equipment}`, "NEQ_CEP"],
                    ["B 372", "Place at Ramp", "07/22/2026 00:22", `23-802 / ${equipmentView.railcar} ${equipmentView.well} / ${equipmentView.equipment}`, "NEQ_CEP"],
                    ["B 372", "Train Arrival", "07/21/2026 22:43", `${equipmentView.railcar} ${equipmentView.well} / ${equipmentView.equipment}`, "DTOS999"],
                    ["B 370", "Train Assigned", "07/21/2026 20:40", `${equipmentView.railcar} ${equipmentView.well}`, "DTOS998"],
                    ["B 370", "Loaded to Railcar", "07/21/2026 18:12", equipmentView.equipment, "RAMP_OPS"],
                  ].map((activity, index) => (
                    <tr key={`${activity[1]}-${index}`}>{activity.map((value) => <td key={value}>{value}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
      {railcarInquiry && (
        <div className="inquiry-overlay" role="dialog" aria-modal="true" aria-labelledby="inquiry-title">
          <section className="inquiry-dialog">
            <h2 id="inquiry-title">
              Work Orders for Railcar&nbsp; {railcarInquiry.railcar}&nbsp; Sequence&nbsp; {railcarInquiry.sequence}&nbsp; Track&nbsp; {railcarInquiry.track}
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Equipment ID</th>
                  <th>Well</th>
                  <th>Status</th>
                  <th>Owner Name</th>
                  <th>User ID</th>
                </tr>
              </thead>
              <tbody>
                {railcarInquiry.rows.map((inquiryRow) => (
                  <tr key={`${inquiryRow.equipment}-${inquiryRow.well}`}>
                    <td>{inquiryRow.equipment}</td>
                    <td>{inquiryRow.well}</td>
                    <td>{inquiryRow.status}</td>
                    <td>{inquiryRow.owner}</td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="inquiry-actions">
              <button type="button" onClick={() => setRailcarInquiry(null)}>BACK</button>
              <button type="button">FLIP WELLS</button>
            </div>
          </section>
        </div>
      )}
      {matchChassis && (
        <div className="match-overlay" role="dialog" aria-modal="true" aria-labelledby="match-title">
          <section className="match-dialog">
            <h2 id="match-title">Match Chassis</h2>
            <div className="match-details">
              <dl><dt>Equipment ID</dt><dd>{matchChassis.equipment}</dd></dl>
              <dl><dt>Len</dt><dd>{matchChassis.length}</dd></dl>
              <dl><dt>Railcar ID</dt><dd>{matchChassis.railcar}</dd></dl>
              <dl className={matchChassis.pool === "NONE" ? "pool-alert-field" : undefined}>
                <dt>Pool</dt>
                <dd>
                  {matchChassis.pool === "NONE" ? (
                    <button
                      className="pool-none-highlight alert-reveal-pill"
                      type="button"
                      aria-expanded={revealedMatchAlerts.pool}
                      onClick={() => setRevealedMatchAlerts((current) => ({ ...current, pool: !current.pool }))}
                    >
                      {matchChassis.pool}
                    </button>
                  ) : matchChassis.pool}
                </dd>
                {matchChassis.pool === "NONE" && revealedMatchAlerts.pool && (
                  <aside className="none-pool-alert" role="note">
                    <span aria-hidden="true">!</span>
                    <strong>ALERT: NONE POOL USE TRAC CHASSIS</strong>
                  </aside>
                )}
              </dl>
              <dl><dt>Weight</dt><dd>{matchChassis.weight}</dd></dl>
              <dl><dt>Well</dt><dd>{matchChassis.well}</dd></dl>
              <dl className={matchChassis.shipper === "IMCCOMLLC" ? "shipper-alert-field" : undefined}>
                <dt>Shipper</dt>
                <dd>
                  {matchChassis.shipper === "IMCCOMLLC" ? (
                    <button
                      className="shipper-hotbox-highlight alert-reveal-pill"
                      type="button"
                      aria-expanded={revealedMatchAlerts.shipper}
                      onClick={() => setRevealedMatchAlerts((current) => ({ ...current, shipper: !current.shipper }))}
                    >
                      {matchChassis.shipper}
                    </button>
                  ) : matchChassis.shipper}
                </dd>
                {matchChassis.shipper === "IMCCOMLLC" && revealedMatchAlerts.shipper && (
                  <aside className="hotbox-alert" role="note">
                    <span aria-hidden="true">!</span>
                    <strong>ALERT: IMCCOMLLC is a HOTBOX park in Row F1-F10</strong>
                  </aside>
                )}
              </dl>
              <dl><dt>Seq</dt><dd>{matchChassis.sequence}</dd></dl>
            </div>
            {!chassisMatched ? (
              <>
                <div className="chassis-search-row">
                  <label className={`chassis-input${topContainerFirstAlert || chassisNumberError ? " chassis-input-alert" : ""}`}>
                    <span>Chassis Number</span>
                    <input
                      value={chassisNumber}
                      inputMode="numeric"
                      maxLength={6}
                      aria-describedby="chassis-help"
                      aria-invalid={topContainerFirstAlert || chassisNumberError}
                      onChange={(event) => {
                        setChassisNumber(event.target.value.replace(/\D/g, "").slice(0, 6));
                        setChassisNumberError(false);
                      }}
                    />
                    <b aria-hidden="true">⌕</b>
                  </label>
                  <button
                    className="chassis-search-button"
                    type="button"
                    onClick={() => {
                      if (!selectedRailcarChassis.correct) {
                        setMatchChassis(null);
                        setChassisNumber("");
                        setRailcarChassisError(true);
                        return;
                      }
                      if (chassisNumber === expectedChassisNumber) {
                        setChassisNumberError(false);
                        setChassisMatched(true);
                      } else {
                        setChassisNumberError(true);
                      }
                    }}
                  >
                    SEARCH
                  </button>
                </div>
                <div className={`chassis-help${chassisNumberError ? " chassis-help-error" : ""}`} id="chassis-help">
                  <span>{chassisNumberError ? "Incorrect chassis number. Check the chassis and try again." : "Required: Enter 3 to 6 digits of Chassis Number"}</span>
                  <b>{chassisNumber.length}/6</b>
                </div>
                {topContainerFirstAlert && (
                  <div className="mate-order-alert" role="alert">
                    <b aria-hidden="true">!</b>
                    <strong>Alert: Mate up top container first!</strong>
                  </div>
                )}
                <button className="match-cancel" type="button" onClick={() => setMatchChassis(null)}>CANCEL</button>
              </>
            ) : (
              <div className="matched-chassis-confirmation">
                <p><strong>Chassis ID:</strong> {selectedRailcarChassis.number} <span aria-hidden="true">✎</span></p>
                <div>
                  <button
                    className="matched-complete"
                    type="button"
                    onClick={() => {
                      setCompletedEquipment((current) => new Set(current).add(matchChassis.equipment));
                      if (matchChassis.equipment === "GCXU 519814") setEquipmentFilter("");
                      if (matchChassis.equipment === "GCXU 520695") setShowCompletionSuccess(true);
                      setSelectedRow(null);
                      setOpenActionMenu(null);
                      setMatchChassis(null);
                      setChassisMatched(false);
                      setRailcarChassisIndex(0);
                      setRailcarChassisError(false);
                    }}
                  >
                    COMPLETE
                  </button>
                  <button className="matched-cancel" type="button" onClick={() => setChassisMatched(false)}>CANCEL</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
      {showCompletionSuccess && (
        <div className="training-success-overlay" role="dialog" aria-modal="true" aria-labelledby="training-success-title">
          <section className="training-success-dialog">
            <span className="training-success-check" aria-hidden="true">✓</span>
            <h2 id="training-success-title">Success! Both containers mated!</h2>
            <button
              type="button"
              onClick={() => {
                setShowCompletionSuccess(false);
                onTrainingComplete?.();
              }}
            >
              CLOSE
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function WorkOrders({ onTrainingComplete }: { onTrainingComplete: () => void }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusInstruction, setFocusInstruction] = useState(true);
  const [wrongChoices, setWrongChoices] = useState<Set<string>>(() => new Set());
  const [selectionMessage, setSelectionMessage] = useState<"wrong" | "correct" | null>(null);
  const [wrongOrderScreen, setWrongOrderScreen] = useState<{
    title: string;
    showData: boolean;
    choiceId: string;
  } | null>(null);
  const [showCorrectOrder, setShowCorrectOrder] = useState(false);
  const [instructionSizeEditing, setInstructionSizeEditing] = useState(false);
  const [instructionLayout, setInstructionLayout] = useState(() => loadStoredValue(INSTRUCTION_STORAGE_KEY, { x: 0, y: 0, scale: 1 }));
  const [instructionSaved, setInstructionSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSuccess(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => setShowSuccess(false), 5000);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  useEffect(() => {
    const timer = window.setTimeout(() => setFocusInstruction(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectionMessage) return;
    const timer = window.setTimeout(() => setSelectionMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [selectionMessage]);

  function beginInstructionResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const initialScale = instructionLayout.scale;
    const move = (pointerEvent: PointerEvent) => {
      const distance = ((pointerEvent.clientX - startX) + (pointerEvent.clientY - startY)) / 260;
      setInstructionLayout((layout) => ({
        ...layout,
        scale: Math.min(1.65, Math.max(0.55, initialScale + distance)),
      }));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function beginInstructionDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!instructionSizeEditing || (event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const initialX = instructionLayout.x;
    const initialY = instructionLayout.y;
    const move = (pointerEvent: PointerEvent) => {
      setInstructionLayout((layout) => ({
        ...layout,
        x: initialX + pointerEvent.clientX - startX,
        y: initialY + pointerEvent.clientY - startY,
      }));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function selectOrder(choiceId: string, count: number) {
    setShowSuccess(false);
    if (count !== 18) {
      const trackName = choiceId.match(/^\d-\d{3}/)?.[0] ?? choiceId;
      const type = choiceId.slice(trackName.length + 1).split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join("-");
      setWrongChoices((current) => new Set(current).add(choiceId));
      setWrongOrderScreen({ title: `${type} ${trackName}`, showData: count > 0, choiceId });
      return;
    }
    if (count === 18) {
      setSelectionMessage(null);
      setShowCorrectOrder(true);
      return;
    }

    setWrongChoices((current) => {
      const updated = new Set(current);
      updated.add(choiceId);
      return updated;
    });
    setSelectionMessage("wrong");
  }

  if (wrongOrderScreen) {
    return (
      <EmptyWorkOrder
        title={wrongOrderScreen.title}
        showData={wrongOrderScreen.showData}
        onBack={() => {
          setWrongChoices((current) => {
            const updated = new Set(current);
            updated.add(wrongOrderScreen.choiceId);
            return updated;
          });
          setWrongOrderScreen(null);
        }}
      />
    );
  }

  if (showCorrectOrder) {
    return (
      <EmptyWorkOrder
        title="Inbound-Retrieve 6-802"
        showData
        isCorrect
        onBack={() => setShowCorrectOrder(false)}
        onTrainingComplete={onTrainingComplete}
      />
    );
  }

  return (
    <main className={`work-orders-page${focusInstruction ? " instruction-focus" : ""}`}>
      <div className="work-orders-scroll">
        <table className="work-orders-table">
          <caption className="sr-only">Work orders by yard track and assignment type</caption>
          <thead>
            <tr>
              <th rowSpan={3}>YARD-TRACK</th>
              <th colSpan={7}>WORK ORDERS</th>
            </tr>
            <tr>
              <th colSpan={2}>INBOUND</th>
              <th colSpan={3}>OUTBOUND</th>
              <th rowSpan={2}>
                <button
                  className={`shotgun-size-trigger${instructionSizeEditing ? " active" : ""}`}
                  type="button"
                  aria-pressed={instructionSizeEditing}
                  onClick={() => setInstructionSizeEditing((editing) => !editing)}
                >
                  SHOTGUN
                </button>
              </th>
              <th rowSpan={2}>ALL</th>
            </tr>
            <tr>
              <th>RETRIEVE</th>
              <th>CLEAR</th>
              <th>RETRIEVE</th>
              <th>PLACE</th>
              <th>CLEAR</th>
            </tr>
          </thead>
          <tbody>
            {WORK_ORDERS.map((row) => (
              <tr key={row.track}>
                <th scope="row">{row.track}</th>
                {([
                  ["inbound-retrieve", row.inboundRetrieve, "inbound retrieve"],
                  ["inbound-clear", row.inboundClear, "inbound clear"],
                  ["outbound-retrieve", row.outboundRetrieve, "outbound retrieve"],
                  ["outbound-place", row.outboundPlace, "outbound place"],
                  ["outbound-clear", row.outboundClear, "outbound clear"],
                  ["shotgun", row.shotgun, "shotgun"],
                  ["all", row.all, "all"],
                ] as const).map(([type, count, label]) => {
                  const choiceId = `${row.track}-${type}`;
                  return (
                    <td key={choiceId}>
                      <CountButton
                        count={count}
                        label={`${row.track} ${label}`}
                        isWrong={wrongChoices.has(choiceId)}
                        onSelect={() => selectOrder(choiceId, count)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figure
        className={`yard-instruction${instructionSizeEditing ? " instruction-size-editing" : ""}`}
        style={{ transform: `translate(${instructionLayout.x}px, ${instructionLayout.y}px) scale(${instructionLayout.scale})` }}
        onPointerDown={beginInstructionDrag}
      >
        <div className="yard-announcer-crop">
          <img src="/yard-announcer.jpg" alt="Yard worker announcing an assignment" />
        </div>
        <figcaption>
          <span>YARD INSTRUCTION</span>
          <strong>“INBOUND ON TRACK 802,<br />SET IT UP SOUTH TO NORTH”</strong>
        </figcaption>
        {instructionSizeEditing && (
          <button
            className="yard-instruction-resize-handle"
            type="button"
            aria-label="Resize yard instruction"
            onPointerDown={beginInstructionResize}
          />
        )}
      </figure>
      {instructionSizeEditing && (
        <div className="instruction-size-controls" role="group" aria-label="Yard instruction size controls">
          <strong>INSTRUCTION</strong>
          <span className="instruction-coordinate">X {Math.round(instructionLayout.x)}</span>
          <span className="instruction-coordinate">Y {Math.round(instructionLayout.y)}</span>
          <span className="instruction-coordinate">SIZE {Math.round(instructionLayout.scale * 100)}%</span>
          <button type="button" aria-label="Move instruction left" onClick={() => setInstructionLayout((layout) => ({ ...layout, x: layout.x - 10 }))}>←</button>
          <button type="button" aria-label="Move instruction right" onClick={() => setInstructionLayout((layout) => ({ ...layout, x: layout.x + 10 }))}>→</button>
          <button type="button" aria-label="Make instruction smaller" onClick={() => setInstructionLayout((layout) => ({ ...layout, scale: Math.max(0.55, layout.scale - 0.1) }))}>−</button>
          <button type="button" aria-label="Make instruction larger" onClick={() => setInstructionLayout((layout) => ({ ...layout, scale: Math.min(1.65, layout.scale + 0.1) }))}>+</button>
          <button
            className="instruction-save-button"
            type="button"
            onClick={() => {
              window.localStorage.setItem(INSTRUCTION_STORAGE_KEY, JSON.stringify(instructionLayout));
              setInstructionSaved(true);
              window.setTimeout(() => setInstructionSaved(false), 1800);
            }}
          >
            {instructionSaved ? "SAVED ✓" : "SAVE"}
          </button>
        </div>
      )}
      {showSuccess && (
        <div className="success-toast" role="status" aria-live="polite">
          <span className="toast-check" aria-hidden="true">✓</span>
          <span>
            <strong>Login successful</strong>
            <small>B 372 · Hostler 112389</small>
          </span>
        </div>
      )}
      {selectionMessage && (
        <div
          className={`selection-toast ${selectionMessage}`}
          role="status"
          aria-live="polite"
        >
          <span className="selection-icon" aria-hidden="true">
            {selectionMessage === "wrong" ? "×" : "✓"}
          </span>
          <strong>{selectionMessage === "wrong" ? "Try again" : "Correct selection"}</strong>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  const [location, setLocation] = useState("B 371 - DALLAS - TX");
  const [equipment, setEquipment] = useState("112516");
  const [locationError, setLocationError] = useState(false);
  const [equipmentError, setEquipmentError] = useState(false);
  const [hasAdvanced, setHasAdvanced] = useState(false);
  const [hostlerEditing, setHostlerEditing] = useState(false);
  const [hostlerSaved, setHostlerSaved] = useState(false);
  const [hostlerLayout, setHostlerLayout] = useState(() => loadStoredValue(HOSTLER_LAYOUT_STORAGE_KEY, { x: 0, y: 0, scale: 1 }));

  function beginHostlerDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!hostlerEditing || (event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = hostlerLayout;
    const move = (pointerEvent: PointerEvent) => {
      setHostlerLayout((layout) => ({
        ...layout,
        x: initial.x + pointerEvent.clientX - startX,
        y: initial.y + pointerEvent.clientY - startY,
      }));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function beginHostlerResize(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const initialScale = hostlerLayout.scale;
    const move = (pointerEvent: PointerEvent) => {
      setHostlerLayout((layout) => ({
        ...layout,
        scale: Math.max(0.45, Math.min(2.2, initialScale + (pointerEvent.clientX - startX) / 300)),
      }));
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const wrongLocation = location !== REQUIRED_LOCATION;
    const wrongEquipment = equipment !== REQUIRED_EQUIPMENT;

    setLocationError(wrongLocation);
    setEquipmentError(wrongEquipment);

    if (!wrongLocation && !wrongEquipment) {
      setHasAdvanced(true);
    }
  }

  if (hasAdvanced) {
    return (
      <WorkOrders
        onTrainingComplete={() => {
          setLocation("B 371 - DALLAS - TX");
          setEquipment("112516");
          setLocationError(false);
          setEquipmentError(false);
          setHasAdvanced(false);
        }}
      />
    );
  }

  return (
    <main className="login-page">
      <section className="bulletins" aria-labelledby="bulletin-heading">
        <h1 id="bulletin-heading">
          <button
            className={hostlerEditing ? "bulletin-layout-trigger active" : "bulletin-layout-trigger"}
            type="button"
            aria-pressed={hostlerEditing}
            onClick={() => setHostlerEditing((editing) => !editing)}
          >
            Bulletin Messages
          </button>
        </h1>
      </section>

      <div className="divider" aria-hidden="true" />

      <section className="login-panel" aria-labelledby="login-heading">
        <div className="login-card">
          <h2 id="login-heading">VMU Login</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label className={`select-field${locationError ? " field-error" : ""}`}>
                <span>Select Location</span>
                <select
                  name="location"
                  value={location}
                  aria-invalid={locationError}
                  aria-describedby={locationError ? "location-error" : undefined}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setLocationError(false);
                  }}
                >
                  <option>B 372 - HOUSTON - TX</option>
                  <option>B 371 - DALLAS - TX</option>
                  <option>B 373 - MEMPHIS - TN</option>
                </select>
              </label>
              {locationError && (
                <p className="error-message" id="location-error" role="alert">
                  Check location
                </p>
              )}
            </div>

            <div className="field-group">
              <label className={`select-field${equipmentError ? " field-error" : ""}`}>
                <span>Terminal Equipment</span>
                <select
                  name="equipment"
                  value={equipment}
                  aria-invalid={equipmentError}
                  aria-describedby={equipmentError ? "equipment-error" : undefined}
                  onChange={(event) => {
                    setEquipment(event.target.value);
                    setEquipmentError(false);
                  }}
                >
                  <option>112389</option>
                  <option>112427</option>
                  <option>112516</option>
                </select>
              </label>
              {equipmentError && (
                <p className="error-message" id="equipment-error" role="alert">
                  Check hostler number
                </p>
              )}
            </div>

            <button type="submit">HOSTLER</button>
          </form>
        </div>

        <figure
          className={`hostler-photo${hostlerEditing ? " hostler-photo-editing" : ""}`}
          style={{ transform: `translate(${hostlerLayout.x}px, ${hostlerLayout.y}px) scale(${hostlerLayout.scale})` }}
          onPointerDown={beginHostlerDrag}
        >
          <img
            src="/hostler-112389.png"
            alt="White hostler vehicle numbered 112389"
          />
          {hostlerEditing && (
            <button
              className="hostler-resize-handle"
              type="button"
              aria-label="Resize hostler image"
              onPointerDown={beginHostlerResize}
            />
          )}
        </figure>
        {hostlerEditing && (
          <div className="hostler-layout-controls" role="group" aria-label="Hostler image layout controls">
            <strong>HOSTLER IMAGE</strong>
            <span>X {Math.round(hostlerLayout.x)}</span>
            <span>Y {Math.round(hostlerLayout.y)}</span>
            <span>SIZE {Math.round(hostlerLayout.scale * 100)}%</span>
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem(HOSTLER_LAYOUT_STORAGE_KEY, JSON.stringify(hostlerLayout));
                setHostlerSaved(true);
                window.setTimeout(() => setHostlerSaved(false), 1800);
              }}
            >
              {hostlerSaved ? "SAVED ✓" : "SAVE"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
