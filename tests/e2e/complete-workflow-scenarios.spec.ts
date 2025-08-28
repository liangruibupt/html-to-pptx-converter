import { test, expect } from '@playwright/test';
import { TestUtils, SampleHtmlTemplates } from './test-utils';

/**
 * Complete Workflow Scenario Tests
 * 
 * These tests verify complete end-to-end workflows with realistic user scenarios.
 * Requirements: All - Complete user workflow testing
 */

test.describe('Complete Workflow Scenarios', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    testUtils = new TestUtils(page);
  });

  test('should handle complete blog post conversion workflow', async ({ page }) => {
    // Simulate converting a blog post with typical content
    // Requirements: All - Real-world content conversion

    const blogPostHtml = `
      <html>
        <head>
          <title>My Blog Post</title>
          <meta charset="UTF-8">
        </head>
        <body>
          <article>
            <header>
              <h1>The Future of Web Development</h1>
              <p class="meta">Published on <time datetime="2024-01-15">January 15, 2024</time> by <strong>John Doe</strong></p>
            </header>
            
            <section class="introduction">
              <h2>Introduction</h2>
              <p>Web development continues to evolve at a <em>rapid pace</em>. In this post, we'll explore the latest trends and technologies shaping the future of web development.</p>
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjIwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+V2ViIERldmVsb3BtZW50PC90ZXh0Pjwvc3ZnPg==" alt="Web Development Illustration" />
            </section>

            <section class="trends">
              <h2>Current Trends</h2>
              <p>Several key trends are driving the evolution of web development:</p>
              
              <h3>Frontend Frameworks</h3>
              <ul>
                <li><strong>React</strong> - Component-based architecture</li>
                <li><strong>Vue.js</strong> - Progressive framework</li>
                <li><strong>Angular</strong> - Full-featured platform</li>
                <li><strong>Svelte</strong> - Compile-time optimization</li>
              </ul>

              <h3>Backend Technologies</h3>
              <ol>
                <li>Node.js and Express</li>
                <li>Python with Django/Flask</li>
                <li>Go for high-performance APIs</li>
                <li>Rust for system-level programming</li>
              </ol>
            </section>

            <section class="comparison">
              <h2>Framework Comparison</h2>
              <table border="1">
                <thead>
                  <tr>
                    <th>Framework</th>
                    <th>Learning Curve</th>
                    <th>Performance</th>
                    <th>Community</th>
                    <th>Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>React</strong></td>
                    <td>Medium</td>
                    <td>High</td>
                    <td>Very Large</td>
                    <td>Large Applications</td>
                  </tr>
                  <tr>
                    <td><strong>Vue.js</strong></td>
                    <td>Low</td>
                    <td>High</td>
                    <td>Large</td>
                    <td>Rapid Prototyping</td>
                  </tr>
                  <tr>
                    <td><strong>Angular</strong></td>
                    <td>High</td>
                    <td>High</td>
                    <td>Large</td>
                    <td>Enterprise Apps</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="resources">
              <h2>Useful Resources</h2>
              <p>Here are some valuable resources for web developers:</p>
              <ul>
                <li><a href="https://developer.mozilla.org">MDN Web Docs</a> - Comprehensive web documentation</li>
                <li><a href="https://github.com">GitHub</a> - Code hosting and collaboration</li>
                <li><a href="https://stackoverflow.com">Stack Overflow</a> - Developer Q&A community</li>
                <li><a href="https://codepen.io">CodePen</a> - Online code editor</li>
              </ul>
            </section>

            <footer>
              <h2>Conclusion</h2>
              <p>The future of web development is <mark>bright and exciting</mark>. By staying current with these trends and continuously learning, developers can build amazing web experiences.</p>
              <blockquote>
                <p>"The best way to predict the future is to create it." - <cite>Peter Drucker</cite></p>
              </blockquote>
            </footer>
          </article>
        </body>
      </html>
    `;

    // Upload the blog post HTML
    await testUtils.uploadHtmlFile(blogPostHtml, 'blog-post.html');

    // Verify preview shows the content
    await testUtils.verifyHtmlPreview('The Future of Web Development');

    // Configure for blog post presentation
    await testUtils.setConfiguration({
      layout: 'standard',
      includeImages: true,
      theme: 'professional',
      splitStrategy: 'by-h2'
    });

    // Convert and download
    await testUtils.convertAndWaitForCompletion(20000); // Allow extra time for complex content
    const download = await testUtils.downloadPptx();

    // Verify download
    expect(download.suggestedFilename()).toMatch(/blog-post.*\.pptx$/);
    expect(await download.path()).toBeTruthy();
  });

  test('should handle technical documentation conversion workflow', async ({ page }) => {
    // Simulate converting technical documentation
    // Requirements: All - Technical content conversion

    const technicalDocHtml = `
      <html>
        <head>
          <title>API Documentation</title>
        </head>
        <body>
          <h1>REST API Documentation</h1>
          
          <section id="overview">
            <h2>Overview</h2>
            <p>This API provides access to user management functionality. All endpoints require authentication via <code>Bearer</code> tokens.</p>
            
            <h3>Base URL</h3>
            <pre><code>https://api.example.com/v1</code></pre>
            
            <h3>Authentication</h3>
            <p>Include the authorization header in all requests:</p>
            <pre><code>Authorization: Bearer YOUR_TOKEN_HERE</code></pre>
          </section>

          <section id="endpoints">
            <h2>Endpoints</h2>
            
            <h3>GET /users</h3>
            <p>Retrieve a list of users.</p>
            
            <h4>Parameters</h4>
            <table border="1">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>page</code></td>
                  <td>integer</td>
                  <td>No</td>
                  <td>Page number (default: 1)</td>
                </tr>
                <tr>
                  <td><code>limit</code></td>
                  <td>integer</td>
                  <td>No</td>
                  <td>Items per page (default: 10, max: 100)</td>
                </tr>
                <tr>
                  <td><code>search</code></td>
                  <td>string</td>
                  <td>No</td>
                  <td>Search term for filtering users</td>
                </tr>
              </tbody>
            </table>

            <h4>Response</h4>
            <pre><code>{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}</code></pre>

            <h3>POST /users</h3>
            <p>Create a new user.</p>
            
            <h4>Request Body</h4>
            <table border="1">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>name</code></td>
                  <td>string</td>
                  <td>Yes</td>
                  <td>User's full name</td>
                </tr>
                <tr>
                  <td><code>email</code></td>
                  <td>string</td>
                  <td>Yes</td>
                  <td>Valid email address</td>
                </tr>
                <tr>
                  <td><code>password</code></td>
                  <td>string</td>
                  <td>Yes</td>
                  <td>Minimum 8 characters</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section id="errors">
            <h2>Error Handling</h2>
            <p>The API uses standard HTTP status codes:</p>
            
            <ul>
              <li><strong>200</strong> - Success</li>
              <li><strong>400</strong> - Bad Request</li>
              <li><strong>401</strong> - Unauthorized</li>
              <li><strong>404</strong> - Not Found</li>
              <li><strong>500</strong> - Internal Server Error</li>
            </ul>

            <h3>Error Response Format</h3>
            <pre><code>{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}</code></pre>
          </section>

          <section id="examples">
            <h2>Code Examples</h2>
            
            <h3>JavaScript</h3>
            <pre><code>// Fetch users
const response = await fetch('https://api.example.com/v1/users', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.users);</code></pre>

            <h3>Python</h3>
            <pre><code>import requests

headers = {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.example.com/v1/users', headers=headers)
users = response.json()['users']</code></pre>
          </section>
        </body>
      </html>
    `;

    // Enter technical documentation
    await testUtils.enterHtmlContent(technicalDocHtml);

    // Verify preview
    await testUtils.verifyHtmlPreview('REST API Documentation');

    // Configure for technical documentation
    await testUtils.setConfiguration({
      layout: 'wide', // Wide layout for code examples
      includeImages: false, // No images in this doc
      theme: 'minimal', // Clean theme for technical content
      splitStrategy: 'by-h2' // Split by main sections
    });

    // Convert and verify
    await testUtils.convertAndWaitForCompletion(25000);
    const download = await testUtils.downloadPptx();

    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should handle educational content conversion workflow', async ({ page }) => {
    // Simulate converting educational/training material
    // Requirements: All - Educational content conversion

    const educationalHtml = `
      <html>
        <head>
          <title>Introduction to Machine Learning</title>
        </head>
        <body>
          <h1>Introduction to Machine Learning</h1>
          <p class="subtitle">A Beginner's Guide to AI and ML Concepts</p>

          <section class="learning-objectives">
            <h2>Learning Objectives</h2>
            <p>By the end of this lesson, you will be able to:</p>
            <ol>
              <li>Define machine learning and its key concepts</li>
              <li>Identify different types of machine learning algorithms</li>
              <li>Understand the machine learning workflow</li>
              <li>Recognize real-world applications of ML</li>
            </ol>
          </section>

          <section class="what-is-ml">
            <h2>What is Machine Learning?</h2>
            <p>Machine Learning (ML) is a subset of <strong>Artificial Intelligence (AI)</strong> that enables computers to learn and make decisions from data without being explicitly programmed.</p>
            
            <blockquote>
              <p>"Machine learning is the science of getting computers to act without being explicitly programmed." - <cite>Arthur Samuel</cite></p>
            </blockquote>

            <h3>Key Characteristics</h3>
            <ul>
              <li><strong>Data-driven</strong>: Learns from examples and patterns in data</li>
              <li><strong>Adaptive</strong>: Improves performance with more data</li>
              <li><strong>Automated</strong>: Makes predictions without human intervention</li>
              <li><strong>Scalable</strong>: Can handle large datasets efficiently</li>
            </ul>
          </section>

          <section class="types-of-ml">
            <h2>Types of Machine Learning</h2>
            
            <h3>1. Supervised Learning</h3>
            <p>Learning with <em>labeled examples</em> to make predictions on new data.</p>
            <ul>
              <li><strong>Classification</strong>: Predicting categories (e.g., spam detection)</li>
              <li><strong>Regression</strong>: Predicting continuous values (e.g., house prices)</li>
            </ul>

            <h3>2. Unsupervised Learning</h3>
            <p>Finding <em>hidden patterns</em> in data without labeled examples.</p>
            <ul>
              <li><strong>Clustering</strong>: Grouping similar data points</li>
              <li><strong>Association</strong>: Finding relationships between variables</li>
            </ul>

            <h3>3. Reinforcement Learning</h3>
            <p>Learning through <em>trial and error</em> with rewards and penalties.</p>
            <ul>
              <li>Game playing (e.g., chess, Go)</li>
              <li>Robotics and autonomous systems</li>
            </ul>
          </section>

          <section class="ml-workflow">
            <h2>Machine Learning Workflow</h2>
            
            <table border="1">
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Description</th>
                  <th>Key Activities</th>
                  <th>Tools/Techniques</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>1. Data Collection</strong></td>
                  <td>Gather relevant data</td>
                  <td>Identify sources, collect samples</td>
                  <td>APIs, databases, web scraping</td>
                </tr>
                <tr>
                  <td><strong>2. Data Preparation</strong></td>
                  <td>Clean and format data</td>
                  <td>Handle missing values, normalize</td>
                  <td>Pandas, NumPy, data pipelines</td>
                </tr>
                <tr>
                  <td><strong>3. Model Selection</strong></td>
                  <td>Choose appropriate algorithm</td>
                  <td>Compare different approaches</td>
                  <td>Scikit-learn, TensorFlow</td>
                </tr>
                <tr>
                  <td><strong>4. Training</strong></td>
                  <td>Teach the model</td>
                  <td>Fit model to training data</td>
                  <td>Cross-validation, hyperparameters</td>
                </tr>
                <tr>
                  <td><strong>5. Evaluation</strong></td>
                  <td>Test model performance</td>
                  <td>Measure accuracy, precision</td>
                  <td>Test sets, metrics, validation</td>
                </tr>
                <tr>
                  <td><strong>6. Deployment</strong></td>
                  <td>Put model into production</td>
                  <td>Integrate with applications</td>
                  <td>APIs, cloud platforms, monitoring</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="applications">
            <h2>Real-World Applications</h2>
            
            <h3>Healthcare</h3>
            <ul>
              <li>Medical image analysis and diagnosis</li>
              <li>Drug discovery and development</li>
              <li>Personalized treatment recommendations</li>
            </ul>

            <h3>Finance</h3>
            <ul>
              <li>Fraud detection and prevention</li>
              <li>Algorithmic trading</li>
              <li>Credit scoring and risk assessment</li>
            </ul>

            <h3>Technology</h3>
            <ul>
              <li>Search engines and recommendation systems</li>
              <li>Natural language processing</li>
              <li>Computer vision and image recognition</li>
            </ul>

            <h3>Transportation</h3>
            <ul>
              <li>Autonomous vehicles</li>
              <li>Route optimization</li>
              <li>Predictive maintenance</li>
            </ul>
          </section>

          <section class="getting-started">
            <h2>Getting Started</h2>
            <p>Ready to begin your machine learning journey? Here are some recommended resources:</p>
            
            <h3>Online Courses</h3>
            <ul>
              <li><a href="https://coursera.org/learn/machine-learning">Machine Learning Course by Andrew Ng</a></li>
              <li><a href="https://edx.org/course/introduction-to-artificial-intelligence-ai">MIT Introduction to AI</a></li>
              <li><a href="https://udacity.com/course/machine-learning-engineer-nanodegree">Udacity ML Engineer Nanodegree</a></li>
            </ul>

            <h3>Programming Languages</h3>
            <ul>
              <li><strong>Python</strong> - Most popular for ML (scikit-learn, TensorFlow, PyTorch)</li>
              <li><strong>R</strong> - Great for statistics and data analysis</li>
              <li><strong>Java</strong> - Enterprise applications (Weka, Deeplearning4j)</li>
              <li><strong>JavaScript</strong> - Web-based ML (TensorFlow.js)</li>
            </ul>
          </section>

          <section class="summary">
            <h2>Summary</h2>
            <p>Machine learning is a powerful technology that's transforming industries and creating new possibilities. Key takeaways:</p>
            <ol>
              <li>ML enables computers to learn from data automatically</li>
              <li>Three main types: supervised, unsupervised, and reinforcement learning</li>
              <li>Success requires a systematic workflow from data to deployment</li>
              <li>Applications span healthcare, finance, technology, and transportation</li>
              <li>Getting started requires learning programming and taking courses</li>
            </ol>
            
            <p><strong>Next Steps:</strong> Practice with real datasets and build your first machine learning project!</p>
          </section>
        </body>
      </html>
    `;

    // Enter educational content
    await testUtils.enterHtmlContent(educationalHtml);

    // Verify preview
    await testUtils.verifyHtmlPreview('Introduction to Machine Learning');

    // Configure for educational presentation
    await testUtils.setConfiguration({
      layout: 'standard',
      includeImages: false,
      theme: 'professional', // Professional theme for education
      splitStrategy: 'by-h2' // Split by main topics
    });

    // Convert and verify
    await testUtils.convertAndWaitForCompletion(30000); // Allow extra time for complex content
    const download = await testUtils.downloadPptx();

    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should handle report conversion workflow with mixed content', async ({ page }) => {
    // Simulate converting a business report with mixed content types
    // Requirements: All - Business report conversion

    const reportHtml = `
      <html>
        <head>
          <title>Q4 2024 Business Report</title>
        </head>
        <body>
          <header>
            <h1>Q4 2024 Business Performance Report</h1>
            <p class="report-meta">
              <strong>Report Period:</strong> October - December 2024<br>
              <strong>Prepared by:</strong> Business Analytics Team<br>
              <strong>Date:</strong> January 15, 2025
            </p>
          </header>

          <section class="executive-summary">
            <h2>Executive Summary</h2>
            <p>Q4 2024 demonstrated <strong>exceptional growth</strong> across all key performance indicators. Revenue increased by <mark>23% year-over-year</mark>, while customer satisfaction reached an all-time high of 94%.</p>
            
            <h3>Key Highlights</h3>
            <ul>
              <li>Revenue: $2.4M (+23% YoY)</li>
              <li>New Customers: 1,250 (+18% YoY)</li>
              <li>Customer Retention: 89% (+5% YoY)</li>
              <li>Product Launches: 3 major releases</li>
            </ul>
          </section>

          <section class="financial-performance">
            <h2>Financial Performance</h2>
            
            <h3>Revenue Breakdown</h3>
            <table border="1">
              <thead>
                <tr>
                  <th>Product Line</th>
                  <th>Q4 2024</th>
                  <th>Q4 2023</th>
                  <th>Growth</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Enterprise Software</strong></td>
                  <td>$1,200,000</td>
                  <td>$980,000</td>
                  <td>+22.4%</td>
                  <td>50%</td>
                </tr>
                <tr>
                  <td><strong>Cloud Services</strong></td>
                  <td>$720,000</td>
                  <td>$560,000</td>
                  <td>+28.6%</td>
                  <td>30%</td>
                </tr>
                <tr>
                  <td><strong>Consulting</strong></td>
                  <td>$360,000</td>
                  <td>$310,000</td>
                  <td>+16.1%</td>
                  <td>15%</td>
                </tr>
                <tr>
                  <td><strong>Training & Support</strong></td>
                  <td>$120,000</td>
                  <td>$100,000</td>
                  <td>+20.0%</td>
                  <td>5%</td>
                </tr>
                <tr class="total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>$2,400,000</strong></td>
                  <td><strong>$1,950,000</strong></td>
                  <td><strong>+23.1%</strong></td>
                  <td><strong>100%</strong></td>
                </tr>
              </tbody>
            </table>

            <h3>Cost Analysis</h3>
            <ul>
              <li><strong>Cost of Goods Sold:</strong> $960,000 (40% of revenue)</li>
              <li><strong>Operating Expenses:</strong> $840,000 (35% of revenue)</li>
              <li><strong>Net Profit:</strong> $600,000 (25% margin)</li>
            </ul>
          </section>

          <section class="customer-metrics">
            <h2>Customer Metrics</h2>
            
            <h3>Customer Acquisition</h3>
            <p>We successfully acquired <strong>1,250 new customers</strong> in Q4, representing an 18% increase compared to Q4 2023.</p>
            
            <table border="1">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>New Customers</th>
                  <th>Acquisition Cost</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Digital Marketing</td>
                  <td>625</td>
                  <td>$120</td>
                  <td>3.2%</td>
                </tr>
                <tr>
                  <td>Referrals</td>
                  <td>375</td>
                  <td>$80</td>
                  <td>8.5%</td>
                </tr>
                <tr>
                  <td>Direct Sales</td>
                  <td>188</td>
                  <td>$200</td>
                  <td>12.1%</td>
                </tr>
                <tr>
                  <td>Partnerships</td>
                  <td>62</td>
                  <td>$150</td>
                  <td>5.8%</td>
                </tr>
              </tbody>
            </table>

            <h3>Customer Satisfaction</h3>
            <p>Customer satisfaction reached <mark>94%</mark>, our highest score to date.</p>
            <ul>
              <li>Product Quality: 96%</li>
              <li>Customer Support: 93%</li>
              <li>Value for Money: 91%</li>
              <li>Ease of Use: 95%</li>
            </ul>
          </section>

          <section class="product-development">
            <h2>Product Development</h2>
            
            <h3>Major Releases</h3>
            <ol>
              <li>
                <strong>Enterprise Platform v3.0</strong> (October 2024)
                <ul>
                  <li>Advanced analytics dashboard</li>
                  <li>Enhanced security features</li>
                  <li>Mobile application support</li>
                </ul>
              </li>
              <li>
                <strong>Cloud Integration Suite</strong> (November 2024)
                <ul>
                  <li>Multi-cloud deployment</li>
                  <li>Automated scaling</li>
                  <li>Real-time monitoring</li>
                </ul>
              </li>
              <li>
                <strong>AI-Powered Insights</strong> (December 2024)
                <ul>
                  <li>Machine learning algorithms</li>
                  <li>Predictive analytics</li>
                  <li>Natural language queries</li>
                </ul>
              </li>
            </ol>

            <h3>Development Metrics</h3>
            <ul>
              <li>Features Delivered: 47</li>
              <li>Bug Fixes: 156</li>
              <li>Code Quality Score: 8.7/10</li>
              <li>Test Coverage: 94%</li>
            </ul>
          </section>

          <section class="market-analysis">
            <h2>Market Analysis</h2>
            
            <h3>Competitive Position</h3>
            <p>We maintain a <strong>strong competitive position</strong> in our target markets:</p>
            
            <table border="1">
              <thead>
                <tr>
                  <th>Market Segment</th>
                  <th>Market Share</th>
                  <th>Growth Rate</th>
                  <th>Key Competitors</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Enterprise Software</td>
                  <td>12%</td>
                  <td>+15%</td>
                  <td>CompetitorA, CompetitorB</td>
                </tr>
                <tr>
                  <td>Cloud Services</td>
                  <td>8%</td>
                  <td>+25%</td>
                  <td>CompetitorC, CompetitorD</td>
                </tr>
                <tr>
                  <td>Consulting</td>
                  <td>15%</td>
                  <td>+10%</td>
                  <td>CompetitorE, CompetitorF</td>
                </tr>
              </tbody>
            </table>

            <h3>Market Trends</h3>
            <ul>
              <li>Increased demand for <em>cloud-native solutions</em></li>
              <li>Growing focus on <em>data privacy and security</em></li>
              <li>Rising adoption of <em>AI and machine learning</em></li>
              <li>Shift towards <em>subscription-based models</em></li>
            </ul>
          </section>

          <section class="outlook">
            <h2>2025 Outlook</h2>
            
            <h3>Strategic Priorities</h3>
            <ol>
              <li><strong>Market Expansion</strong>
                <ul>
                  <li>Enter 3 new geographic markets</li>
                  <li>Launch SMB-focused product line</li>
                  <li>Establish strategic partnerships</li>
                </ul>
              </li>
              <li><strong>Product Innovation</strong>
                <ul>
                  <li>Invest in AI/ML capabilities</li>
                  <li>Enhance mobile experience</li>
                  <li>Develop industry-specific solutions</li>
                </ul>
              </li>
              <li><strong>Operational Excellence</strong>
                <ul>
                  <li>Improve customer support response times</li>
                  <li>Optimize development processes</li>
                  <li>Enhance data security measures</li>
                </ul>
              </li>
            </ol>

            <h3>Financial Projections</h3>
            <p>Based on current trends and strategic initiatives, we project:</p>
            <ul>
              <li><strong>Revenue Growth:</strong> 20-25% in 2025</li>
              <li><strong>New Customers:</strong> 4,000-5,000</li>
              <li><strong>Profit Margin:</strong> 28-30%</li>
              <li><strong>Market Share:</strong> Increase by 2-3 percentage points</li>
            </ul>
          </section>

          <footer>
            <h2>Conclusion</h2>
            <p>Q4 2024 was a <strong>remarkable quarter</strong> that exceeded expectations across all key metrics. Our strong financial performance, customer growth, and successful product launches position us well for continued success in 2025.</p>
            
            <blockquote>
              <p>"Success is not final, failure is not fatal: it is the courage to continue that counts." - <cite>Winston Churchill</cite></p>
            </blockquote>

            <p>For questions about this report, please contact the Business Analytics Team at <a href="mailto:analytics@company.com">analytics@company.com</a>.</p>
          </footer>
        </body>
      </html>
    `;

    // Upload the business report
    await testUtils.uploadHtmlFile(reportHtml, 'q4-2024-report.html');

    // Verify preview
    await testUtils.verifyHtmlPreview('Q4 2024 Business Performance Report');

    // Configure for business report
    await testUtils.setConfiguration({
      layout: 'wide', // Wide layout for tables and data
      includeImages: false, // No images in this report
      theme: 'professional', // Professional theme for business
      splitStrategy: 'by-h2' // Split by main sections
    });

    // Convert and verify
    await testUtils.convertAndWaitForCompletion(35000); // Allow extra time for complex tables
    const download = await testUtils.downloadPptx();

    expect(download.suggestedFilename()).toMatch(/q4-2024-report.*\.pptx$/);
  });

  test('should handle error recovery in complex workflow', async ({ page }) => {
    // Test error recovery during complex conversion workflow
    // Requirements: 3.7, 3.8, 5.4 - Error handling and recovery

    // Start with problematic HTML
    const problematicHtml = `
      <html>
        <body>
          <h1>Error Recovery Test</h1>
          <p>This document has some issues</p>
          <img src="invalid-image-url.jpg" alt="Broken Image" />
          <table>
            <tr><td>Incomplete table
          </table>
          <div class="unclosed-div">
            <p>Unclosed elements
        </body>
      </html>
    `;

    await testUtils.enterHtmlContent(problematicHtml);

    // Configure settings
    await testUtils.setConfiguration({
      layout: 'standard',
      includeImages: true, // This might cause issues with broken image
      theme: 'default',
      splitStrategy: 'by-h2'
    });

    // Attempt conversion
    await page.locator('[data-testid="convert-button"]').click();

    // Handle potential error or success
    const downloadButton = page.locator('[data-testid="download-button"]');
    const errorMessage = page.locator('[data-testid="error-message"]');

    try {
      // Wait for either success or error
      await Promise.race([
        downloadButton.waitFor({ timeout: 15000 }),
        errorMessage.waitFor({ timeout: 15000 })
      ]);

      if (await errorMessage.isVisible()) {
        // Error occurred - test recovery
        await testUtils.verifyErrorMessage();

        // Try recovery with corrected HTML
        const correctedHtml = `
          <html>
            <body>
              <h1>Error Recovery Test - Corrected</h1>
              <p>This document has been fixed</p>
              <h2>Section 1</h2>
              <p>Content for section 1</p>
              <table border="1">
                <tr><th>Header</th></tr>
                <tr><td>Complete table data</td></tr>
              </table>
              <h2>Section 2</h2>
              <div class="properly-closed">
                <p>Properly closed elements</p>
              </div>
            </body>
          </html>
        `;

        await testUtils.enterHtmlContent(correctedHtml);
        
        // Retry conversion
        await testUtils.convertAndWaitForCompletion();
        const download = await testUtils.downloadPptx();
        expect(download.suggestedFilename()).toMatch(/\.pptx$/);
      } else {
        // Conversion succeeded despite issues
        const download = await testUtils.downloadPptx();
        expect(download.suggestedFilename()).toMatch(/\.pptx$/);
      }
    } catch (error) {
      // If neither success nor error message appeared, fail the test
      throw new Error('Expected either successful conversion or error message');
    }
  });
});