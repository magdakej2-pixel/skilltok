# SkillTok — Scalability Plan

> Architecture evolution from MVP to 1M and 10M users.

---

## Current Architecture (MVP)

```mermaid
graph TB
    subgraph "Client"
        A[Expo App<br/>iOS / Android / Web]
    end

    subgraph "Backend"
        B[Express API<br/>Node.js]
    end

    subgraph "Data Layer"
        C[(MongoDB Atlas<br/>Free Tier)]
        D[Firebase Auth]
        E[Firebase Storage<br/>Videos + Images]
    end

    A -->|REST API| B
    A -->|Auth Tokens| D
    A -->|Video Upload| E
    B -->|Verify Token| D
    B -->|CRUD| C
    E -->|CDN| A
```

### Current Limits (Free Tier)

| Resource | Limit | Supports |
|----------|-------|----------|
| MongoDB Atlas | 512 MB | ~50K videos metadata |
| Firebase Auth | 50K MAU | 50K monthly active users |
| Firebase Storage | 5 GB | ~100 videos (50MB each) |
| Render (backend) | 750 hours/mo | 1 instance, sleeps after inactivity |

---

## 1M Users Architecture

```mermaid
graph TB
    subgraph "CDN Layer"
        CDN[CloudFront / Cloud CDN]
    end

    subgraph "Load Balancer"
        LB[Nginx / ALB]
    end

    subgraph "API Cluster"
        API1[Express API #1]
        API2[Express API #2]
        API3[Express API #3]
    end

    subgraph "Cache Layer"
        REDIS[(Redis Cluster)]
    end

    subgraph "Database"
        PRIMARY[(MongoDB Primary)]
        REPLICA1[(Read Replica #1)]
        REPLICA2[(Read Replica #2)]
    end

    subgraph "Storage"
        S3[AWS S3 / GCS<br/>Video Storage]
    end

    subgraph "Auth"
        AUTH[Firebase Auth<br/>or Auth0]
    end

    CDN --> LB
    LB --> API1 & API2 & API3
    API1 & API2 & API3 --> REDIS
    API1 & API2 & API3 --> PRIMARY
    REDIS --> PRIMARY
    PRIMARY --> REPLICA1 & REPLICA2
    API1 & API2 & API3 --> AUTH
    S3 --> CDN
```

### Key Changes at 1M Users

| Component | Change | Rationale |
|-----------|--------|-----------|
| **Backend** | 3+ API instances behind load balancer | Horizontal scaling |
| **Database** | MongoDB Atlas M10+ with read replicas | Read-heavy workload |
| **Cache** | Redis for feed, user session, popular videos | Reduce DB reads by 80% |
| **Storage** | AWS S3 / GCS with CDN | Scale beyond 5GB, global CDN |
| **Video Delivery** | CloudFront / Cloud CDN | Low latency globally |
| **Search** | Elasticsearch for video search | Full-text, faceted search |
| **Monitoring** | Datadog / New Relic | APM, error tracking |

### Estimated Monthly Cost: $200–500

---

## 10M Users Architecture

```mermaid
graph TB
    subgraph "Global CDN"
        CDN[Multi-Region CDN<br/>CloudFront]
    end

    subgraph "API Gateway"
        GW[Kong / AWS API Gateway]
    end

    subgraph "Microservices"
        SVC1[Auth Service]
        SVC2[Video Service]
        SVC3[Feed Service]
        SVC4[Social Service]
        SVC5[Search Service]
        SVC6[Notification Service]
    end

    subgraph "Message Queue"
        KAFKA[Kafka / SQS]
    end

    subgraph "Databases"
        MONGO[(MongoDB Sharded)]
        ELASTIC[(Elasticsearch)]
        REDIS[(Redis Cluster)]
        POSTGRES[(PostgreSQL<br/>Analytics)]
    end

    subgraph "Video Pipeline"
        UPLOAD[Upload Service]
        TRANSCODE[FFmpeg Workers]
        S3[S3 Multi-Region]
    end

    subgraph "ML / Recommendation"
        REC[Recommendation Engine]
        ML[ML Pipeline]
    end

    CDN --> GW
    GW --> SVC1 & SVC2 & SVC3 & SVC4 & SVC5 & SVC6
    SVC2 & SVC3 & SVC4 --> KAFKA
    KAFKA --> SVC6
    SVC3 --> REDIS
    SVC5 --> ELASTIC
    SVC2 & SVC3 & SVC4 --> MONGO
    SVC3 --> REC
    REC --> ML
    UPLOAD --> TRANSCODE
    TRANSCODE --> S3
    S3 --> CDN
```

### Key Changes at 10M Users

| Component | Change | Rationale |
|-----------|--------|-----------|
| **Architecture** | Microservices (6+ services) | Independent scaling |
| **Database** | MongoDB sharding by region | Data locality |
| **Events** | Kafka for async processing | Decouple services |
| **Video** | Transcoding pipeline (FFmpeg workers) | Multiple resolutions (360p, 720p, 1080p) |
| **Feed** | ML-powered recommendation engine | Personalized content |
| **Notifications** | Push + in-app notifications | Real-time engagement |
| **Search** | Elasticsearch cluster | Advanced search, autocomplete |
| **Analytics** | PostgreSQL data warehouse | Business intelligence |
| **Deployment** | Kubernetes (EKS/GKE) | Container orchestration |

### Estimated Monthly Cost: $5,000–15,000

---

## Migration Roadmap

### Phase 1: 10K → 100K Users
- [ ] Upgrade MongoDB Atlas to M10
- [ ] Add Redis caching for feed and sessions
- [ ] Move videos to S3 with CloudFront CDN
- [ ] Add Sentry for error tracking

### Phase 2: 100K → 1M Users
- [ ] Deploy 3+ API instances behind load balancer
- [ ] Add MongoDB read replicas
- [ ] Implement Elasticsearch for search
- [ ] Add video transcoding (720p + 360p)
- [ ] Set up CI/CD pipeline

### Phase 3: 1M → 10M Users
- [ ] Decompose into microservices
- [ ] Implement Kafka event streaming
- [ ] Build ML recommendation engine
- [ ] Add sharding and multi-region deployment
- [ ] Implement real-time notifications

---

## Monetization Architecture (Future)

### Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Full access to free content |
| **Premium** | $9.99/mo | Premium videos, no ads, certificates |
| **Pro (Teachers)** | $19.99/mo | Analytics, scheduling, live streaming |

### Implementation

- `User.monetizationTier` → `null | 'free' | 'premium' | 'pro'`
- `Video.isPremium` → gates premium-only content
- Payment: Stripe integration via `POST /api/monetization/subscribe`
- Revenue share: 70% teacher / 30% platform
