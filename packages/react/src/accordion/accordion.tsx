import {createContext, useContext, useId, useMemo, useState, type ReactNode} from 'react';
import {Disclosure, DisclosureContent, DisclosureProvider} from '../disclosure/disclosure.js';

export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

export interface AccordionOptions {
  /**
   * The heading level each header renders at. Required, with no default: a
   * default would be right often enough to look fine and wrong exactly where a
   * page's outline is unusual, which is the case nobody checks.
   */
  headingLevel: AccordionHeadingLevel;
  /** Opening one panel closes the others. Off by default — collapsing a panel the reader opened is a surprise. */
  single?: boolean;
  children: ReactNode;
  className?: string;
}

interface AccordionContextValue {
  readonly headingLevel: AccordionHeadingLevel;
  readonly openId: string | undefined;
  readonly setOpenId: ((id: string | undefined) => void) | undefined;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

export function Accordion({headingLevel, single = false, className, children}: AccordionOptions): React.JSX.Element {
  const [openId, setOpenId] = useState<string | undefined>();
  const value = useMemo(
    () => ({headingLevel, openId, setOpenId: single ? setOpenId : undefined}),
    [headingLevel, openId, single],
  );

  return (
    <AccordionContext.Provider value={value}>
      <div className={className === undefined ? 'lat-accordion' : `lat-accordion ${className}`}>{children}</div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  /** The header's text. Rendered inside the heading, as the button's own label. */
  label: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function AccordionItem({
  label,
  defaultOpen = false,
  className,
  children,
}: AccordionItemProps): React.JSX.Element {
  const context = useContext(AccordionContext);

  if (context === undefined) {
    throw new Error('AccordionItem must be rendered inside an Accordion');
  }

  const id = useId();
  const {headingLevel, openId, setOpenId} = context;
  const Heading = `h${headingLevel}` as 'h2';

  const coordinated =
    setOpenId === undefined
      ? {defaultOpen}
      : {
          open: openId === id,
          setOpen: (open: boolean): void => {
            setOpenId(open ? id : undefined);
          },
        };

  return (
    <DisclosureProvider {...coordinated}>
      <div className={className === undefined ? 'lat-accordion__item' : `lat-accordion__item ${className}`}>
        {/* The button inside the heading, not the heading inside the button:
            a screen reader navigating by heading must land on the text. */}
        <Heading className="lat-accordion__heading">
          <Disclosure bare className="lat-accordion__trigger">
            {label}
          </Disclosure>
        </Heading>
        <DisclosureContent className="lat-accordion__panel">{children}</DisclosureContent>
      </div>
    </DisclosureProvider>
  );
}
