using MediatR;

namespace SplitApp.Tests.TestSupport;

public sealed class RecordingMediator : IMediator
{
    public List<object> PublishedNotifications { get; } = new();

    public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Tests use this mediator only for published notifications.");
    }

    public Task Send<TRequest>(TRequest request, CancellationToken cancellationToken = default)
        where TRequest : IRequest
    {
        throw new NotSupportedException("Tests use this mediator only for published notifications.");
    }

    public Task<object?> Send(object request, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Tests use this mediator only for published notifications.");
    }

    public IAsyncEnumerable<TResponse> CreateStream<TResponse>(
        IStreamRequest<TResponse> request,
        CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Stream requests are outside this test scope.");
    }

    public IAsyncEnumerable<object?> CreateStream(object request, CancellationToken cancellationToken = default)
    {
        throw new NotSupportedException("Stream requests are outside this test scope.");
    }

    public Task Publish(object notification, CancellationToken cancellationToken = default)
    {
        PublishedNotifications.Add(notification);
        return Task.CompletedTask;
    }

    public Task Publish<TNotification>(TNotification notification, CancellationToken cancellationToken = default)
        where TNotification : INotification
    {
        PublishedNotifications.Add(notification);
        return Task.CompletedTask;
    }
}
