import MultiSelectDropdown from "../../components/MultiSelectDropdown";
import { getTags } from "../../services/dbService";
import styles from "./SearchPage.module.css";

export default function FilterPanel({ years, setYear, competition, setCompetition, tags, setTags, type, setType }) {
    const tagOptions = getTags().map((name, i) => ({ value: i, label: name }));

    return (
        <div className={styles.filterPanel}>
            <MultiSelectDropdown
                groupName="filterPanel"
                label="Year"
                options={[
                    { value: 2025, label: "2025" },
                    { value: 2026, label: "2026" }
                ]}
                selected={years}
                onChange={setYear}
            />
            <MultiSelectDropdown
                groupName="filterPanel"
                label="Competition"
                options={[
                    { value: "districts", label: "Districts" },
                    { value: "regionals", label: "Regionals" }
                ]}
                selected={competition}
                onChange={setCompetition}
            />
            <MultiSelectDropdown
                groupName="filterPanel"
                label="Type"
                options={[
                    { value: "written", label: "Written" },
                    { value: "programming", label: "Programming" }
                ]}
                selected={type}
                onChange={setType}
            />
            <MultiSelectDropdown groupName="filterPanel" label="Tags" options={tagOptions} selected={tags} onChange={setTags} maxPreview={2} />
        </div>
    );
}
