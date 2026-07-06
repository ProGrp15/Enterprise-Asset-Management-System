import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

const Contact = () => {
  return (
    <section className="py-5 bg-light">
      <div className="container">

        <div className="text-center mb-5">
          <h1 className="fw-bold">Contact Us</h1>
          <p className="text-secondary">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>

        <div className="row g-5">

          {/* Contact Form */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">

                <h3 className="mb-4">Send Us a Message</h3>

                <form>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter subject"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea
                      rows="5"
                      className="form-control"
                      placeholder="Write your message..."
                    ></textarea>
                  </div>

                  <button className="btn btn-primary px-4">
                    Send Message
                  </button>
                </form>

              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="col-lg-5">

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <h4 className="mb-4">Contact Information</h4>

                <div className="d-flex mb-4">
                  <FaEnvelope className="text-primary mt-1 me-3" />
                  <div>
                    <strong>Email</strong>
                    <p className="text-secondary mb-0">
                      support@assetflow.com
                    </p>
                  </div>
                </div>

                <div className="d-flex mb-4">
                  <FaPhoneAlt className="text-primary mt-1 me-3" />
                  <div>
                    <strong>Phone</strong>
                    <p className="text-secondary mb-0">
                      +91 98765 43210
                    </p>
                  </div>
                </div>

                <div className="d-flex">
                  <FaMapMarkerAlt className="text-primary mt-1 me-3" />
                  <div>
                    <strong>Location</strong>
                    <p className="text-secondary mb-0">
                      Pune, Maharashtra, India
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="alert alert-primary shadow-sm">
              <strong>Business Hours:</strong>
              <br />
              Monday - Friday: 9:00 AM - 6:00 PM
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;