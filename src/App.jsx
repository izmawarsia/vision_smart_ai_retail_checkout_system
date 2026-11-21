import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown, ArrowRight, ArrowUp, Camera, Github, Linkedin, Menu, Package,
  ScanLine, ShoppingCart, Sparkles, ChartNoAxesCombined, Boxes, X, Database,
  Zap, Tags, Upload, CheckCircle2, CreditCard, Banknote, Trash2, Receipt,
  LoaderCircle, ImagePlus, RotateCcw
} from "lucide-react";

const team = [
  { name: "Izma Warsia", roll: "CT-24311" },
  { name: "Safa Khurram", roll: "CT-24310" },
  { name: "Iman Abshar", roll: "CT-24151" },
  { name: "Shiza Naveed", roll: "CT-24110" }
];

const features = [
  { icon: ScanLine, title: "AI Product Detection", desc: "Recognizes supported products from checkout images." },
  { icon: ShoppingCart, title: "Automated Billing", desc: "Matches detected items with store prices." },
  { icon: Package, title: "Inventory Management", desc: "Keeps transaction and stock records organized." },
  { icon: ChartNoAxesCombined, title: "Sales Insights", desc: "Turns recorded sales into useful summaries." }
];
const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const prettyName = (value = "") => value.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [productCount] = useState("69");
  const [livePage, setLivePage] = useState(window.location.pathname === "/live");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [items, setItems] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [scanError, setScanError] = useState("");
  const [bill, setBill] = useState(null);
  const [transactionMeta, setTransactionMeta] = useState(null);
  const [billing, setBilling] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const onPop = () => setLivePage(window.location.pathname === "/live");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const openLive = () => {
    if (window.location.pathname !== "/live") window.history.pushState({}, "", "/live");
    setLivePage(true); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "auto" });
  };
  const goHome = () => {
    if (window.location.pathname !== "/") window.history.pushState({}, "", "/");
    setLivePage(false); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "auto" });
  };
  const resetCheckout = () => {
    setFile(null); setItems([]); setBill(null); setTransactionMeta(null); setScanMessage(""); setScanError("");
    setPaymentMethod("Cash"); setPaying(false); setPaid(false);
  };
  const scanImage = async () => {
    if (!file || scanning) return;
    setScanning(true); setScanError(""); setScanMessage("");
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch("/scan-item", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "The image could not be scanned.");
      if (!data.detected) setScanError(data.message || "No supported product was detected. Try a clearer front-label image.");
      else {
        setItems((current) => {
          const found = current.find((item) => item.class_name === data.class_name);
          if (found) return current.map((item) => item.class_name === data.class_name ? { ...item, quantity: item.quantity + 1 } : item);
          return [...current, { class_name: data.class_name, display_name: prettyName(data.class_name), quantity: 1, confidence: data.confidence }];
        });
        setScanMessage(`${prettyName(data.class_name)} detected and added to your basket.`); setFile(null);
      }
    } catch (error) { setScanError(error.message || "Cannot connect to the AI backend. Make sure the backend is running."); }
    finally { setScanning(false); }
  };
  const removeItem = (className) => setItems((current) => current.filter((item) => item.class_name !== className));
  const changeQuantity = (className, delta) => setItems((current) => current.map((item) => item.class_name === className ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  const createBill = async () => {
    if (!items.length || billing) return;
    setBilling(true); setScanError("");
    try {
      const response = await fetch("/generate-bill", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scanned_items: items.flatMap((item) => Array(item.quantity).fill(item.class_name)) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not generate the bill.");
      const stamp = new Date();
      const reference = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, "0")}${String(stamp.getDate()).padStart(2, "0")}-${String(stamp.getHours()).padStart(2, "0")}${String(stamp.getMinutes()).padStart(2, "0")}${String(stamp.getSeconds()).padStart(2, "0")}`;
      setTransactionMeta({ invoice: `VC-${reference}`, transaction: `TXN-${reference}`, date: stamp.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) });
      setBill(data);
    } catch (error) { setScanError(error.message || "Bill generation failed. Check the backend connection."); }
    finally { setBilling(false); }
  };
  const confirmPayment = () => {
    if (paying || !bill) return;
    setPaying(true);
    window.setTimeout(() => { setPaying(false); setPaid(true); window.setTimeout(() => { resetCheckout(); }, 2600); }, 1700);
  };


  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 450);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (id) => {
    const target = document.getElementById(id);
    if (target) {
      const header = document.querySelector(".topbar");
      const headerHeight = header?.getBoundingClientRect().height ?? 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 18;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); livePage ? goHome() : goTo("home"); }}>
          <span className="brand-icon"><ShoppingCart size={24} /></span>
          <span>VisionCart <b>AI</b></span>
        </a>
        {!livePage && <button className="menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>}
        {!livePage && <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          {["Home", "About", "Journey", "Team", "Links"].map((item) => (
            <button key={item} onClick={() => goTo(item === "Journey" ? "how-it-works" : item.toLowerCase())}>{item}</button>
          ))}
        </nav>}
        <button className="nav-cta" onClick={livePage ? goHome : openLive}>{livePage ? "Back to Website" : "Try It Live"} <ArrowRight size={15} /></button>
      </header>
      {livePage ? (
        <main className="live-page-main">
        <section className="live-section section-anchor" id="live-checkout">
          <div className="section-heading"><span className="eyebrow"><Zap size={14} /> INTERACTIVE DEMO · LIVE AI SCANNER</span><h2>Your smart <span>checkout.</span></h2><p>Upload a product photo, scan it with the trained model, and watch your basket update.</p></div>
          {paid ? (
            <div className="payment-success glass-card"><div className="success-icon"><CheckCircle2 size={42} /></div><span className="eyebrow">TRANSACTION COMPLETE</span><h3>Payment Successful!</h3><p>Your demo checkout is complete. Taking you back to a fresh upload screen…</p><div className="success-total">{money(bill?.grand_total)}</div></div>
          ) : (
            <div className="checkout-layout">
              <div className="scanner-panel glass-card">
                {!bill ? <>
                  <div className="panel-heading"><div><h3>Upload &amp; scan</h3></div><span className="live-pill"><i /> AI READY</span></div>
                  <label className={`upload-zone ${preview ? "has-preview" : ""}`}>
                    {preview ? <img className="upload-preview" src={preview} alt="Selected product preview" /> : <><span className="upload-icon"><ImagePlus size={30} /></span><strong>Choose a product image</strong><span>Click to browse files on your computer</span><small>JPG, JPEG, PNG · One product per image</small></>}
                    <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ""; setScanError(""); setScanMessage(""); }} />
                  </label>
                  {preview && <div className="selected-file"><span><Camera size={15} /> {file?.name}</span><button onClick={() => setFile(null)} type="button" aria-label="Remove selected image"><X size={16} /></button></div>}
                  <button className="scan-button" disabled={!file || scanning} onClick={scanImage}>{scanning ? <><LoaderCircle className="spin" size={18} /> Scanning with AI…</> : <><ScanLine size={18} /> Scan Product</>}</button>
                  {scanMessage && <div className="notice success-notice"><CheckCircle2 size={16} /> {scanMessage}</div>}
                  {scanError && <div className="notice error-notice">{scanError}</div>}
                </> : <>
                  <div className="panel-heading"><div><h3>Review your bill</h3></div><span className="live-pill"><CheckCircle2 size={14} /> READY</span></div>
                  <section className="receipt-paper" aria-label="VisionCart AI sales receipt">
                    <div className="receipt-brand">VISIONCART <span>AI</span></div>
                    <div className="receipt-subtitle">SMART RETAIL · SALES INVOICE</div>
                    <div className="receipt-meta">
                      <div><span>Invoice No.</span><b>{transactionMeta?.invoice || "—"}</b></div>
                      <div><span>Transaction No.</span><b>{transactionMeta?.transaction || "—"}</b></div>
                      <div><span>Date</span><b>{transactionMeta?.date || "—"}</b></div>
                    </div>
                    <div className="receipt-table-wrap">
                      <table className="receipt-table">
                        <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                        <tbody>{bill.items.map((item) => <tr key={item.class_name}><td>{item.display_name}</td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td>{money(item.unit_price * item.quantity)}</td></tr>)}</tbody>
                      </table>
                    </div>
                    <div className="receipt-totals">
                      <div><span>Subtotal</span><b>{money(bill.subtotal)}</b></div>
                      {bill.total_discount > 0 && <div><span>Discount</span><b>− {money(bill.total_discount)}</b></div>}
                      <div><span>Tax ({bill.tax_percent}%)</span><b>{money(bill.total_tax)}</b></div>
                      <div className="receipt-grand-total"><span>Total Payable</span><strong>{money(bill.grand_total)}</strong></div>
                    </div>
                    <div className="receipt-thanks">Thank you for shopping with VisionCart AI</div>
                  </section>
                  <button className="text-action" onClick={() => setBill(null)}><ArrowDown size={15} /> Back to product scanning</button>
                </>}
              </div>

              <aside className="basket-panel glass-card">
                <div className="panel-heading"><div><h3><ShoppingCart size={19} /> Detected items</h3></div><span className="item-counter">{itemCount} items</span></div>
                {items.length ? <div className="basket-list">{items.map((item) => <div className="basket-item" key={item.class_name}><div className="product-symbol"><Package size={18} /></div><div className="basket-product"><strong>{item.display_name}</strong><small>{item.confidence != null ? `${Math.round(item.confidence * 100)}% confidence` : "AI detected"}</small><div className="qty-control"><button disabled={!!bill} onClick={() => changeQuantity(item.class_name, -1)}>-</button><b>{item.quantity}</b><button disabled={!!bill} onClick={() => changeQuantity(item.class_name, 1)}>+</button></div></div><button className="remove-item" disabled={!!bill} onClick={() => removeItem(item.class_name)} aria-label={`Remove ${item.display_name}`}><Trash2 size={15} /></button></div>)}</div> : <div className="empty-basket"><span><ShoppingCart size={27} /></span><strong>Your basket is empty</strong><p>Scanned products will appear here. Upload one image at a time to get started.</p></div>}
                <div className="basket-footer">
                  <div className="basket-count"><span>Unique products</span><b>{items.length}</b></div>
                  {!bill ? <button className="checkout-button" disabled={!items.length || billing} onClick={createBill}>{billing ? <><LoaderCircle className="spin" size={17} /> Generating bill…</> : <><Receipt size={17} /> Confirm items &amp; generate bill</>}</button> : <div className="payment-box"><span className="eyebrow">STEP 03 · PAYMENT METHOD</span><h4>Choose payment method</h4><div className="payment-options"><button className={paymentMethod === "Cash" ? "payment-option active" : "payment-option"} onClick={() => setPaymentMethod("Cash")}><Banknote size={19} /> Cash</button><button className={paymentMethod === "Card" ? "payment-option active" : "payment-option"} onClick={() => setPaymentMethod("Card")}><CreditCard size={19} /> Card</button></div><div className="demo-payment-note">Demo checkout only — no real payment or bank details are collected.</div><button className="checkout-button pay-button" disabled={paying} onClick={confirmPayment}>{paying ? <><LoaderCircle className="spin" size={17} /> Processing…</> : <><CheckCircle2 size={17} /> Confirm {paymentMethod} Payment</>}</button></div>}
                  <button className="reset-action" onClick={resetCheckout}><RotateCcw size={14} /> Start a new checkout</button>
                </div>
              </aside>
            </div>
          )}
        </section>
        </main>
      ) : (
        <main>
        <section className="hero section-anchor" id="home">
          <div className="hero-visual">
            <img src="/visioncart-hero-crop.png" alt="AI scanner identifying grocery products at a smart checkout counter" />
            <div className="visual-glow" />
            <div className="visual-caption"><span className="live-dot" /> SMART VISION · REAL-TIME PRODUCT DETECTION</div>
          </div>
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> SMART RETAIL, POWERED BY AI</div>
            <h1>VisionCart <span>AI</span></h1>
            <h2>Smart Checkout &amp; Inventory Management System</h2>
            <p>A more effortless retail experience, powered by computer vision that recognizes products, supports smart billing, and keeps store operations connected.</p>
            <div className="hero-actions">
              <button className="primary-btn" onClick={openLive}>Try It Now <ArrowRight size={17} /></button>
            </div>
            <div className="hero-proof">
              <span><ScanLine size={16} /> Computer Vision</span>
              <span><ShoppingCart size={16} /> Smart Billing</span>
              <span><Database size={16} /> Stock Insights</span>
            </div>
          </div>
          <div className="hero-glow" />
          <button className="scroll-cue" onClick={() => goTo("about")} aria-label="Scroll to About"><span>SCROLL TO EXPLORE</span><ArrowDown size={16} /></button>
        </section>

        <section className="about-section section-anchor" id="about">
          <div className="section-heading">
            <span className="eyebrow">BUILT FOR SMARTER RETAIL</span>
            <h2>Fast. Clear. <span>Connected.</span></h2>
            <p>One intelligent flow connecting product recognition, checkout, and store operations.</p>
          </div>
          <div className="about-layout">
            <div className="dataset-visual">
              <img src="/product-dataset-crop.png" alt="Floating grocery products and a shopping basket representing the VisionCart AI product dataset" />
              <span className="image-tag"><Sparkles size={14} /> SMART PRODUCT DATASET</span>
            </div>
            <article className="about-overlay-card glass-card">
              <span className="eyebrow">A LITTLE ABOUT THE PROJECT</span>
              <h3>Retail, made <em>smarter.</em></h3>
              <p>VisionCart AI uses deep learning and computer vision to recognize products from checkout images, match them with store prices, prepare an estimated bill, and help keep inventory records organized.</p>
              <div className="dataset-stat">
                <strong>62</strong>
                <span>Products In Store</span>
              </div>
              <div className="about-overlay-foot"><Sparkles size={14} /> COMPUTER VISION · SMART RETAIL</div>
            </article>
          </div>
        </section>

        <section className="workflow-section section-anchor" id="how-it-works">
          <div className="workflow-heading">
            <div className="section-heading">
              <span className="eyebrow">THE CHECKOUT JOURNEY</span>
              <h2>One Smooth Flow. <span>Four Smart Steps.</span></h2>
              <p>From the first camera frame to an organized transaction record.</p>
            </div>
          </div>
          <div className="workflow-visual">
            <img src="/checkout-journey-crop.png" alt="Four connected stages: camera capture, AI product recognition, smart checkout and inventory update" />
          </div>
          <div className="steps-grid">
            {[
              { n: "01", icon: Camera, title: "Capture", desc: "Take or upload a checkout image." },
              { n: "02", icon: ScanLine, title: "Recognize", desc: "Detect supported product classes." },
              { n: "03", icon: ShoppingCart, title: "Calculate", desc: "Match detected items with prices." },
              { n: "04", icon: Boxes, title: "Update", desc: "Record transactions for inventory." }
            ].map(({ n, icon: Icon, title, desc }) => (
              <article className="step-card" key={n}>
                <span className="step-number">{n}</span><div className="step-icon"><Icon /></div>
                <div><h3>{title}</h3><p>{desc}</p></div>
              </article>
            ))}
          </div>
          <div className="workflow-caption glass-card">
            <span className="eyebrow"><ScanLine size={14} /> FROM CAMERA TO CHECKOUT</span>
            <p>One connected process turns a checkout image into recognized products, a clear bill, and an updated inventory record.</p>
          </div>
        </section>

        <section className="team-section section-anchor" id="team">
          <div className="section-heading">
            <span className="eyebrow">THE PEOPLE BEHIND THE PROJECT</span>
            <h2>Meet our <span>team.</span></h2>
            <p>Four minds working together to make retail checkout smarter.</p>
          </div>
          <div className="team-grid">
            {team.map((member, index) => (
              <article className="member-card" key={member.roll}>
                <div className={`avatar avatar-${index + 1}`}>{member.name.split(" ").map((n) => n[0]).join("")}</div>
                <h3>{member.name}</h3><span>{member.roll}</span>
              </article>
            ))}
          </div>
          <div className="team-foot"><span className="team-line" /><p>VISIONCART AI <b>·</b> SMARTER RETAIL EXPERIENCE</p><span className="team-line" /></div>
        </section>

        <section className="links-section section-anchor" id="links">
          <div className="links-intro"><span className="eyebrow">STAY CONNECTED</span><h2>Explore our <span>project.</span></h2><p>Follow the development and connect with the team through our project platforms.</p></div>
          <div className="social-links">
            <a href="#about" onClick={(e) => { e.preventDefault(); goTo("about"); }}><Sparkles /><span><b>Explore the project</b><small>Discover the VisionCart AI concept</small></span><ArrowRight /></a>
            <a href="https://github.com/" target="_blank" rel="noreferrer"><Github /><span><b>GitHub</b><small>Code, updates &amp; development</small></span><ArrowRight /></a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer"><Linkedin /><span><b>LinkedIn</b><small>Connect with the team</small></span><ArrowRight /></a>
          </div>
          <footer><a className="brand footer-brand" href="#home" onClick={(e) => { e.preventDefault(); goTo("home"); }}><span className="brand-icon"><ShoppingCart size={19} /></span><span>VisionCart <b>AI</b></span></a><p>Smart Checkout &amp; Inventory Management System</p><small>© {new Date().getFullYear()} VisionCart AI · Academic project</small></footer>
        </section>
        </main>
      )}
      {!livePage && showTop && <button className="to-top" aria-label="Scroll to top" onClick={() => goTo("home")}><ArrowUp size={20} /></button>}
    </div>
  );
}
export default App;
