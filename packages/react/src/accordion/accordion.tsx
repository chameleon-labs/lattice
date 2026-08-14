import {createContext, useContext, useEffect, useId, useMemo, useState, type ComponentPropsWithRef} from 'react';
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
}

export type AccordionProps = Omit<ComponentPropsWithRef<'div'>, 'children'> &
  AccordionOptions & {children: React.ReactNode};

interface AccordionContextValue {
  readonly headingLevel: AccordionHeadingLevel;
  readonly openId: string | undefined;
  readonly setOpenId: ((id: string | undefined) => void) | undefined;
  readonly claimDefault: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

export function Accordion({
  headingLevel,
  single = false,
  className,
  children,
  ...props
}: AccordionProps): React.JSX.Element {
  const [openId, setOpenId] = useState<string | undefined>();
  const value = useMemo(
    () => ({
      headingLevel,
      openId,
      setOpenId: single ? setOpenId : undefined,
      // First in DOM order wins: effects run in mount order, and `?? id` means
      // a later claim finds the slot taken.
      claimDefault: (id: string): void => {
        setOpenId((previous) => previous ?? id);
      },
    }),
    [headingLevel, openId, single],
  );

  return (
    <AccordionContext.Provider value={value}>
      <div {...props} className={className === undefined ? 'lat-accordion' : `lat-accordion ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemOptions {
  /** The header's text. Rendered inside the heading, as the button's own label. */
  label: React.ReactNode;
  defaultOpen?: boolean;
}

export type AccordionItemProps = Omit<ComponentPropsWithRef<'div'>, 'children'> &
  AccordionItemOptions & {children: React.ReactNode};

export function AccordionItem({
  label,
  defaultOpen = false,
  className,
  children,
  ...props
}: AccordionItemProps): React.JSX.Element {
  const context = useContext(AccordionContext);

  if (context === undefined) {
    throw new Error('AccordionItem must be rendered inside an Accordion');
  }

  const id = useId();
  const {headingLevel, openId, setOpenId, claimDefault} = context;
  const Heading = `h${headingLevel}` as 'h2';
  const controlled = setOpenId !== undefined;

  useEffect(() => {
    if (controlled && defaultOpen) {
      claimDefault(id);
    }
    // Mount only: `defaultOpen` is an initial state, not a binding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div {...props} className={className === undefined ? 'lat-accordion__item' : `lat-accordion__item ${className}`}>
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
