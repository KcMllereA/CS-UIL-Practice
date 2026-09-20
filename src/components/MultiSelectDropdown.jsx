import { useEffect, useRef, useState } from "react";
import styles from "./MultiSelectDropdown.module.css";
import { clsx } from "../utils";

export default function MultiSelectDropdown({ label, options, selected = [], onChange, groupName }) {
    const toggle = (value) => {
        onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
    };

    const [query, setQuery] = useState("");
    const inputRef = useRef(null);
    const detailsRef = useRef(null);
    useEffect(() => {
        const el = detailsRef.current;
        if (!el) return;
        const handleToggle = () => {
            if (el.open) {
                setQuery("");
                requestAnimationFrame(() => inputRef.current?.focus());
            }
        };
        el.addEventListener("toggle", handleToggle);
        return () => el.removeEventListener("toggle", handleToggle);
    }, []);

    const filteredOptions = query.trim()
        ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
        : options;

    const selectedOptions = options.filter((o) => selected.includes(o.value));    

    return (
        <details className={styles.dropdown} name={groupName} ref={detailsRef}>
            <summary className={styles.trigger}>
                <span className={styles.triggerLabel}>
                    <span className={styles.triggerLabelText}>{label}</span>
                </span>
                <span className={styles.pillRow}>
                    <span className={clsx(styles.pill, styles.overflowPill)}>{selectedOptions.length}</span>
                </span>
                <span className={styles.chevron} />
            </summary>
            <div className={styles.panel}>
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                />
                <div className={styles.optionsList}>
                {filteredOptions.length == 0 ? (
                    <span className={styles.noResults}>No matches</span>
                ) : (
                    filteredOptions.map((o) => (
                        <label className={styles.option} key={o.value}>
                            <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
                            <span className={styles.checkbox} />
                            <span className={styles.optionLabel}>{o.label}</span>
                        </label>
                    ))
                )}
                </div>
            </div>
        </details>
    );
}
