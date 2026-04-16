import "./pageShell.css";

export default function PageShell({ title, children }) {
  return (
    <div className="pageShell">
      <div className="pageBg" />
      <div className="pageWrap">
        <div className="pageContent">
          {title ? <h1 className="pageTitle">{title}</h1> : null}
          {children}
        </div>
      </div>
    </div>
  );
}

