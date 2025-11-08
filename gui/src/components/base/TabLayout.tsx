import { Button } from "./Button";

type Props<T extends string> = {
  children: React.ReactNode;
  tabs: { [K in T]: string };
  activeTab: T;
  onTabChange: (tab: T) => void;
  actions?: React.ReactNode;
};

export function TabLayout<T extends string>({ children, tabs, activeTab, onTabChange, actions }: Props<T>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <ul className="flex gap-4">
          {Object.entries(tabs).map((entry) => {
            const [tabName, tabLabel] = entry as [T, string];
            return (
              <Tab
                key={tabName}
                name={tabName}
                label={tabLabel}
                isSelected={activeTab === tabName}
                onSelect={() => onTabChange(tabName)}
              />
            );
          })}
        </ul>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

type TabProps = {
  name: string;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
};

function Tab({ name, label, onSelect }: TabProps) {
  return (
    <li key={name}>
      <Button color="blue" onClick={() => onSelect()}>
        {label}
      </Button>
    </li>
  );
}
