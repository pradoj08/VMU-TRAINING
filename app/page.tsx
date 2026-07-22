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
  "yard-image": { x: -28, y: 55, scale: 1.4 },
  "chassis": { x: -87, y: 51, scale: 0.52 },
  "tnpz-flag": { x: -411, y: 153, scale: 0.44 },
  "blue-note": { x: -1100, y: 75, scale: 0.84 },
  "orange-note": { x: -1101, y: 75, scale: 0.84 },
};

const LAYOUT_STORAGE_KEY = "hostler-training-visual-layout-v6";
const PANEL_STORAGE_KEY = "hostler-training-editor-position";
const INSTRUCTION_STORAGE_KEY = "hostler-training-instruction-layout";

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
  const [chassisMatched, setChassisMatched] = useState(false);
  const [completedEquipment, setCompletedEquipment] = useState<Set<string>>(() => new Set());
  const [showCompletionSuccess, setShowCompletionSuccess] = useState(false);
  const [revealedMatchAlerts, setRevealedMatchAlerts] = useState({ pool: false, shipper: false });
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [visualLayout, setVisualLayout] = useState(() => loadStoredValue(LAYOUT_STORAGE_KEY, DEFAULT_VISUAL_LAYOUT));
  const [editPanelPosition, setEditPanelPosition] = useState(() => loadStoredValue(PANEL_STORAGE_KEY, { x: 12, y: 12 }));
  const [layoutSaved, setLayoutSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowTryAgain(false), 5000);
    return () => window.clearTimeout(timer);
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
    if (sequence === "Tops Only") return row[wellIndex].toUpperCase().includes("T");
    return true;
  });
  const orderedRows = direction === "north" ? activeRows : [...activeRows].reverse();

  function changeDirection(nextDirection: "north" | "south") {
    setDirection(nextDirection);
    setSelectedRow(null);
    setOpenActionMenu(null);
  }

  function changeVisual(item: VisualItem, x: number, y: number, scaleAmount = 0) {
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
    const value = visualLayout[item];
    return { transform: `translate(${value.x}px, ${value.y}px) scale(${value.scale})` };
  }

  function beginVisualDrag(item: VisualItem, event: ReactPointerEvent<HTMLElement>) {
    if (!layoutEditMode || (event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = visualLayout[item];
    const move = (pointerEvent: PointerEvent) => {
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
    window.localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(editPanelPosition));
    setLayoutSaved(true);
    window.setTimeout(() => setLayoutSaved(false), 1800);
  }

  const expectedChassisNumber = matchChassis?.equipment === "GCXU 520695" ? "255391" : "456231";

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
          <label><span>Equipment ID</span><input aria-label="Equipment ID" /></label>
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
                        setChassisMatched(false);
                        setRevealedMatchAlerts({ pool: false, shipper: false });
                      } else {
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
                      <button type="button" role="menuitem">View Equipment</button>
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
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr className="no-data-row"><td colSpan={columns.length}>No Data Found</td></tr>
            )}
          </tbody>
        </table>
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
                className="railcar-layer-wrapper"
                style={visualStyle("yard-image")}
                onPointerDown={(event) => beginVisualDrag("yard-image", event)}
              >
                <img className="railcar-layer" src="/trackside-intermodal.png" alt="Double-stack intermodal railcar" />
                {completedEquipment.has("GCXU 519814") && <div className="removed-container-mask blue-container-mask" aria-hidden="true"></div>}
                {completedEquipment.has("GCXU 520695") && <div className="removed-container-mask orange-container-mask" aria-hidden="true"></div>}
              </div>
              {!completedEquipment.has("GCXU 520695") && (
                <>
                  <img
                    className="standalone-chassis-layer"
                    src="/chassis-40-cropped.png"
                    alt="Blue chassis"
                    style={visualStyle("chassis")}
                    onPointerDown={(event) => beginVisualDrag("chassis", event)}
                  />
                  <div
                    className="tnpz-flag"
                    style={visualStyle("tnpz-flag")}
                    onPointerDown={(event) => beginVisualDrag("tnpz-flag", event)}
                  >
                    {completedEquipment.has("GCXU 519814") ? "TNPZ 255391" : "TNPZ 456231"}
                  </div>
                </>
              )}
              {!completedEquipment.has("GCXU 519814") && (
                <div className="unit-zoom-card blue-card" style={visualStyle("blue-note")} onPointerDown={(event) => beginVisualDrag("blue-note", event)}>
                  <span>BLUE CONTAINER</span>
                  <strong>GCXU 519814</strong>
                </div>
              )}
              {!completedEquipment.has("GCXU 520695") && (
                <div className="unit-zoom-card orange-card" style={visualStyle("orange-note")} onPointerDown={(event) => beginVisualDrag("orange-note", event)}>
                  <span>ORANGE CONTAINER</span>
                  <strong>GCXU 520695</strong>
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
                    ["tnpz-flag", "TNPZ FLAG"],
                    ["blue-note", "BLUE TEXT"],
                    ["orange-note", "ORANGE TEXT"],
                  ] as Array<[VisualItem, string]>).map(([item, label]) => (
                    <LayoutControls
                      key={item}
                      label={label}
                      className={`${item}-controls`}
                      value={visualLayout[item]}
                      onMove={(x, y) => changeVisual(item, x, y)}
                      onResize={(amount) => changeVisual(item, 0, 0, amount)}
                    />
                  ))}
                  <button className="reset-visual-layout" type="button" onClick={() => setVisualLayout(DEFAULT_VISUAL_LAYOUT)}>RESET ALL</button>
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
        <button type="button">MOVE</button>
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
                  <label className="chassis-input">
                    <span>Chassis Number</span>
                    <input
                      value={chassisNumber}
                      inputMode="numeric"
                      maxLength={6}
                      aria-describedby="chassis-help"
                      onChange={(event) => setChassisNumber(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                    <b aria-hidden="true">⌕</b>
                  </label>
                  <button className="chassis-search-button" type="button" onClick={() => chassisNumber === expectedChassisNumber && setChassisMatched(true)}>SEARCH</button>
                </div>
                <div className="chassis-help" id="chassis-help">
                  <span>Required: Enter 3 to 6 digits of Chassis Number</span>
                  <b>{chassisNumber.length}/6</b>
                </div>
                <button className="match-cancel" type="button" onClick={() => setMatchChassis(null)}>CANCEL</button>
              </>
            ) : (
              <div className="matched-chassis-confirmation">
                <p><strong>Chassis ID:</strong> TNPZ {expectedChassisNumber} <span aria-hidden="true">✎</span></p>
                <div>
                  <button
                    className="matched-complete"
                    type="button"
                    onClick={() => {
                      setCompletedEquipment((current) => new Set(current).add(matchChassis.equipment));
                      if (matchChassis.equipment === "GCXU 520695") setShowCompletionSuccess(true);
                      setSelectedRow(null);
                      setOpenActionMenu(null);
                      setMatchChassis(null);
                      setChassisMatched(false);
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
      >
        <img src="/yard-announcer.jpg" alt="Yard worker announcing an assignment" />
        <figcaption>
          <span>YARD INSTRUCTION</span>
          <strong>“INBOUND ON TRACK 802,<br />SET IT UP SOUTH TO NORTH”</strong>
        </figcaption>
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
        <h1 id="bulletin-heading">Bulletin Messages</h1>
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

        <figure className="hostler-photo">
          <img
            src="/hostler-112389.png"
            alt="White hostler vehicle numbered 112389"
          />
        </figure>
      </section>
    </main>
  );
}
